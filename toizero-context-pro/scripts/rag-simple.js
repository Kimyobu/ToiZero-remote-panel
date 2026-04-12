// very simple keyword search RAG
const fs=require("fs");
const fg=require("fast-glob");

const query=process.argv[2];

async function main(){
  const files=await fg(["backend/src/**/*.ts","frontend/src/**/*.{ts,tsx}"]);
  let results=[];

  for(const f of files){
    const c=fs.readFileSync(f,"utf-8");
    if(c.toLowerCase().includes(query.toLowerCase())){
      results.push(f);
    }
  }

  console.log("Relevant files:");
  console.log(results.join("\n"));
}

main();
