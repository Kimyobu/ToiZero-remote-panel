import * as cheerio from 'cheerio';

export interface Task {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  status: 'solved' | 'attempted' | 'not_submitted';
  lastSubmission: string | null;
  pdfUrl: string | null;
  category: string; // A1, A2, A3
}

export interface TaskDetail {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  status: 'solved' | 'attempted' | 'not_submitted';
  pdfUrl: string | null;
  csrfToken: string | null;
  submissions: Submission[];
  rawHtml?: string;
}

export interface Submission {
  id: string;
  timestamp: string;
  result: string;
  score: number | null;
  language?: string;
}

// Extract task category from task ID (e.g. "A1-001" -> "A1")
export function getCategoryFromId(taskId: string): string {
  const match = taskId.match(/^([A-Z]\d+)/);
  return match ? match[1] : 'Unknown';
}

// Normalize status from text
function normalizeStatus(text: string): 'solved' | 'attempted' | 'not_submitted' {
  const lower = text.toLowerCase().trim();
  
  // If it's explicitly 0 / 100
  if (lower.startsWith('0') && lower.includes('/')) {
    return 'attempted';
  }
  
  // If it's something like 100 / 100 or 50 / 100
  const slashMatch = lower.match(/(?:^|\s)(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) {
    const s = parseInt(slashMatch[1]);
    const m = parseInt(slashMatch[2]);
    if (s >= m && m > 0) return 'solved';
    return 'attempted';
  }

  if (lower.includes('accept') || lower === '100' || lower.includes('correct') || lower.includes('evaluated')) {
    return 'solved';
  } else if (lower === '' || lower === '-' || lower === 'n/a' || lower.includes('no sub') || lower.includes('not submitted')) {
    return 'not_submitted';
  } else if (lower.includes('evaluated')) {
    return 'attempted';
  } else {
    return 'attempted';
  }
}

// Parse score from text like "75/100" or "75"
function parseScore(text: string): { score: number | null; maxScore: number } {
  text = text.replace(/\s+/g, ' ').trim();
  // Match "75 / 100" or "75/100"
  const slashMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) {
    return { score: parseInt(slashMatch[1]), maxScore: parseInt(slashMatch[2]) };
  }
  // Match standalone numbers
  const numMatch = text.match(/^(\d+)$/);
  if (numMatch) {
    return { score: parseInt(numMatch[1]), maxScore: 100 };
  }
  return { score: null, maxScore: 100 };
}

// Parse the task overview page
export function parseTaskList(html: string): Task[] {
  const $ = cheerio.load(html);
  const tasks: Task[] = [];

  // Try multiple possible selectors for task rows
  const selectors = [
    'table tbody tr',
    '.task-list tr',
    '.scoreboard tr',
    'tr[class*="task"]',
    'tr',
  ];

  let rows: cheerio.Cheerio<any> | null = null;
  for (const selector of selectors) {
    const found = $(selector).filter((_, el) => {
      const text = $(el).text().trim();
      // Filter rows that look like task entries (contain task ID pattern)
      return /[A-Z]\d+-\d{3}/.test(text);
    });
    if (found.length > 0) {
      rows = found;
      break;
    }
  }

  if (!rows || rows.length === 0) {
    // Fallback: look for links containing task IDs
    $('a[href*="/tasks/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const idMatch = href.match(/\/tasks\/([A-Z]\d+-\d{3})/);
      if (!idMatch) return;

      const taskId = idMatch[1];
      const row = $(el).closest('tr');
      const cells = row.find('td');
      
      const scoreText = cells.eq(1).text().trim() || '';
      const statusText = cells.eq(2).text().trim() || '';
      const { score, maxScore } = parseScore(scoreText);

      tasks.push({
        id: taskId,
        title: $(el).text().trim() || taskId,
        score,
        maxScore,
        status: normalizeStatus(statusText || scoreText),
        lastSubmission: cells.eq(3).text().trim() || null,
        pdfUrl: null,
        category: getCategoryFromId(taskId),
      });
    });

    return tasks;
  }

  rows.each((_, row) => {
    const cells = $(row).find('td, th');
    if (cells.length === 0) return;

    // Find task ID from href or cell content
    const link = $(row).find('a[href*="/tasks/"]');
    const href = link.attr('href') || '';
    
    // Check multiple cells for task ID (usually 0 or 1)
    let taskId = '';
    const idMatch = href.match(/\/tasks\/([A-Z]\d+-\d{3})/);
    if (idMatch) {
      taskId = idMatch[1];
    } else {
      for (let j = 0; j < Math.min(3, cells.length); j++) {
        const text = cells.eq(j).text().trim();
        const m = text.match(/([A-Z]\d+-\d{3})/);
        if (m) {
          taskId = m[1];
          break;
        }
      }
    }

    if (!taskId) return;

    // Title is usually the cell after the ID. Let's try to find it.
    let titleCell = link.text().trim();
    if (!titleCell) {
      // Find the cell containing the task ID
      let idIndex = -1;
      cells.each((i, c) => {
        if ($(c).text().indexOf(taskId) !== -1 && idIndex === -1) {
          idIndex = i;
        }
      });
      // Title is usually the next cell
      if (idIndex !== -1 && idIndex + 1 < cells.length) {
        titleCell = cells.eq(idIndex + 1).text().trim();
      } else {
        titleCell = cells.eq(1).text().trim() || taskId;
      }
    }
    
    let scoreText = '';
    let statusText = '';
    let dateText = '';

    // First cell is often the score in the overview tab
    const firstCellText = cells.eq(0).text().trim();
    if (/\d+\s*\/\s*\d+/.test(firstCellText) || /^\d+$/.test(firstCellText)) {
      scoreText = firstCellText;
    }

    // Try to extract score/status from remaining cells
    cells.each((i, cell) => {
      const text = $(cell).text().trim();
      if (!scoreText && (/\d+\/\d+/.test(text) || /^\d+$/.test(text))) {
        scoreText = text;
      }
      if (/accept|wrong|pending|compile|runtime|eval/i.test(text)) {
        statusText = statusText || text;
      }
      if (/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}/.test(text)) {
        dateText = dateText || text;
      }
    });

    const { score, maxScore } = parseScore(scoreText);

    tasks.push({
      id: taskId,
      title: titleCell,
      score,
      maxScore,
      status: normalizeStatus(statusText || scoreText),
      lastSubmission: dateText || null,
      pdfUrl: null,
      category: getCategoryFromId(taskId),
    });
  });

  return tasks;
}

// Parse task detail page
export function parseTaskDetail(html: string, taskId: string): TaskDetail {
  const $ = cheerio.load(html);

  // Extract title
  const title = $('h1, h2, .task-title, [class*="title"]').first().text().trim() || taskId;

  // Extract CSRF token
  const csrfToken = 
    $('input[name="_xsrf"]').val() as string ||
    $('input[name="csrf_token"]').val() as string ||
    $('input[name="_token"]').val() as string ||
    $('meta[name="csrf-token"]').attr('content') ||
    $('input[name="csrfmiddlewaretoken"]').val() as string ||
    null;

  // Extract PDF link
  let pdfUrl: string | null = null;
  $('a[href$=".pdf"], a[href*=".pdf"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !pdfUrl) {
      pdfUrl = href.startsWith('http') ? href : `https://toi-coding.informatics.buu.ac.th${href}`;
    }
  });

  // Extract score
  let score: number | null = null;
  let maxScore = 100;
  
  // Try to find score in specialized CMS labels first
  const scoreBadge = $('.label-info:contains("/"), .badge:contains("/"), .score:contains("/"), .task_score .score').first().text().trim();
  const summaryScore = $('.task-score, #score, .total-score, .task_score').first().text().trim();
  const winScore = $('.score_100, .score_0_100').first().text().trim();

  const finalScoreText = scoreBadge || summaryScore || winScore || '';
  console.log(`[Parser] Found potential score text: "${finalScoreText}"`);

  if (finalScoreText) {
    const parsed = parseScore(finalScoreText);
    score = parsed.score;
    maxScore = parsed.maxScore;
  }

  // Parse submission history
  const submissions = parseSubmissionHistory(html);
  
  // If we have submissions but couldn't find a head score, try taking from latest submission
  if (score === null && submissions.length > 0) {
    const latest = submissions[0]; // Latest first
    score = latest.score;
  }

  // Determine status
  let status: 'solved' | 'attempted' | 'not_submitted' = 'not_submitted';
  if (submissions.length > 0) {
    status = 'attempted';
  }

  if (score !== null) {
    if (score >= maxScore && maxScore > 0) {
      status = 'solved';
    } else {
      status = 'attempted';
    }
  }

  return {
    id: taskId,
    title,
    score,
    maxScore,
    status,
    pdfUrl,
    csrfToken,
    submissions,
  };
}

// Parse submission history from task page
export function parseSubmissionHistory(html: string): Submission[] {
  const $ = cheerio.load(html);
  const submissions: Submission[] = [];

  // Try to find submission table
  const tableSelectors = [
    'table[class*="submission"]',
    '.submission-list table',
    '.submissions table',
    'table',
  ];

  for (const selector of tableSelectors) {
    const table = $(selector);
    if (table.length === 0) continue;

    table.find('tbody tr, tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const cellTexts = cells.map((_, cell) => $(cell).text().trim()).get();
      
      // Look for rows with timestamp-like content
      const hasDate = cellTexts.some(t => /\d{2}:\d{2}|\d{4}-\d{2}-\d{2}/.test(t));
      if (!hasDate && i > 0) return;

      let timestamp = '';
      let result = '';
      let subScore: number | null = null;
      let language = '';

      cellTexts.forEach(text => {
        if (/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}/.test(text)) {
          timestamp = timestamp || text;
        } else if (/accept|wrong|pending|compile|runtime|tle|mle/i.test(text)) {
          result = result || text;
        } else if (/python|c\+\+|java|cpp/i.test(text)) {
          language = language || text;
        } else if (/\d+\/\d+|\d+/.test(text) && !timestamp) {
          const parsed = parseScore(text);
          if (parsed.score !== null) subScore = parsed.score;
        }
      });

      if (timestamp || result) {
        submissions.push({
          id: `sub-${i}`,
          timestamp: timestamp || new Date().toISOString(),
          result: result || 'Unknown',
          score: subScore,
          language: language || undefined,
        });
      }
    });

    if (submissions.length > 0) break;
  }

  return submissions.reverse(); // latest first
}

// Extract available PDF attachments from page
export function extractPdfLinks(html: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  
  $('a[href$=".pdf"], a[href*=".pdf"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const fullUrl = href.startsWith('http') 
        ? href 
        : `https://toi-coding.informatics.buu.ac.th${href}`;
      if (!links.includes(fullUrl)) links.push(fullUrl);
    }
  });

  return links;
}

// Check if user is authenticated (page doesn't redirect to login)
export function isAuthenticated(html: string): boolean {
  const $ = cheerio.load(html);
  const bodyText = $('body').text().toLowerCase();
  
  if (bodyText.includes('please log in') || bodyText.includes('login required')) {
    return false;
  }
  if ($('form[action*="login"], input[name="password"]').length > 0) {
    const hasLogout = $('a[href*="logout"], button:contains("logout")').length > 0;
    if (!hasLogout) return false;
  }
  
  return true;
}
