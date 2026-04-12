import * as monaco from 'monaco-editor';

export interface SignatureEntry {
  label: string;
  documentation: string;
  parameters: { label: string; documentation: string }[];
}

export const PYTHON_SIGNATURES: Record<string, SignatureEntry> = {
  'print': {
    label: 'print(*values, sep=\' \', end=\'\\n\', file=sys.stdout, flush=False)',
    documentation: 'Prints the values to a stream, or to sys.stdout by default.',
    parameters: [
      { label: '*values', documentation: 'The values to be printed.' },
      { label: 'sep', documentation: 'String inserted between values, default a space.' },
      { label: 'end', documentation: 'String appended after the last value, default a newline.' },
      { label: 'file', documentation: 'A file-like object (stream); defaults to the current sys.stdout.' },
      { label: 'flush', documentation: 'Whether to forcibly flush the stream.' },
    ]
  },
  'len': {
    label: 'len(obj)',
    documentation: 'Return the number of items in a container.',
    parameters: [{ label: 'obj', documentation: 'The object to check the length of.' }]
  },
  'range': {
    label: 'range(start, stop[, step])',
    documentation: 'Returns an immutable sequence of numbers.',
    parameters: [
      { label: 'start', documentation: 'The starting value (inclusive).' },
      { label: 'stop', documentation: 'The ending value (exclusive).' },
      { label: 'step', documentation: 'The difference between each number in the sequence.' },
    ]
  },
  'int': {
    label: 'int(x=0, base=10)',
    documentation: 'Convert a number or string to an integer.',
    parameters: [
      { label: 'x', documentation: 'The value to convert.' },
      { label: 'base', documentation: 'The number system base (default 10).' },
    ]
  },
  'input': {
    label: 'input(prompt=\'\')',
    documentation: 'Reads a string from standard input.',
    parameters: [{ label: 'prompt', documentation: 'The prompt to display.' }]
  },
  'sum': {
    label: 'sum(iterable, start=0)',
    documentation: 'Returns the sum of a start value plus an iterable of numbers.',
    parameters: [
      { label: 'iterable', documentation: 'The numbers to sum.' },
      { label: 'start', documentation: 'The initial value.' },
    ]
  },
  'map': {
    label: 'map(function, *iterables)',
    documentation: 'Return an iterator that applies function to every item of iterable.',
    parameters: [
      { label: 'function', documentation: 'The function to apply.' },
      { label: '*iterables', documentation: 'One or more iterables.' },
    ]
  },
  'sorted': {
    label: 'sorted(iterable, *, key=None, reverse=False)',
    documentation: 'Return a new list containing all items from the iterable in ascending order.',
    parameters: [
      { label: 'iterable', documentation: 'The sequence to sort.' },
      { label: 'key', documentation: 'A function that serves as a key for the sort comparison.' },
      { label: 'reverse', documentation: 'If set to True, the list elements are sorted as if each comparison were reversed.' },
    ]
  }
};

export const CPP_SIGNATURES: Record<string, SignatureEntry> = {
  'sort': {
    label: 'sort(first, last, comp)',
    documentation: 'Sorts the elements in the range [first,last) into ascending order.',
    parameters: [
      { label: 'first', documentation: 'Random-access iterator to the initial position.' },
      { label: 'last', documentation: 'Random-access iterator to the final position.' },
      { label: 'comp', documentation: 'Binary function that accepts two elements and returns bool.' },
    ]
  },
  'lower_bound': {
    label: 'lower_bound(first, last, val)',
    documentation: 'Returns an iterator pointing to the first element in the range [first,last) which does not compare less than val.',
    parameters: [
      { label: 'first', documentation: 'Forward iterator to the initial position.' },
      { label: 'last', documentation: 'Forward iterator to the final position.' },
      { label: 'val', documentation: 'Value of the lower bound to search for.' },
    ]
  },
  'push_back': {
    label: 'push_back(val)',
    documentation: 'Adds a new element at the end of the container.',
    parameters: [{ label: 'val', documentation: 'Value to be copied or moved to the new element.' }]
  }
};

export const registerSignatureHelp = (monacoInstance: any, lang: string, signatures: Record<string, SignatureEntry>) => {
  return monacoInstance.languages.registerSignatureHelpProvider(lang, {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp: (model: any, position: any) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      // Rough regex to find function name before '('
      const match = textUntilPosition.match(/(\w+)\s*\(([^()]*)$/);
      if (!match) return null;

      const functionName = match[1];
      const argsText = match[2];
      const activeParameter = (argsText.match(/,/g) || []).length;

      const sig = signatures[functionName];
      if (!sig) return null;

      return {
        value: {
          signatures: [{
            label: sig.label,
            documentation: sig.documentation,
            parameters: sig.parameters
          }],
          activeSignature: 0,
          activeParameter
        },
        dispose: () => {}
      };
    }
  });
};

export const registerHoverProvider = (monacoInstance: any, lang: string, signatures: Record<string, SignatureEntry>) => {
  return monacoInstance.languages.registerHoverProvider(lang, {
    provideHover: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const sig = signatures[word.word];
      if (!sig) return null;

      return {
        range: new monacoInstance.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [
          { value: `**${sig.label}**` },
          { value: sig.documentation }
        ]
      };
    }
  });
};
