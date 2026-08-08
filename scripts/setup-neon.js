const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

function parseJsonSafe(str) {
  const start = str.indexOf('[');
  const end = str.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    return JSON.parse(str.slice(start, end + 1));
  }
  
  const startObj = str.indexOf('{');
  const endObj = str.lastIndexOf('}');
  if (startObj !== -1 && endObj !== -1) {
    return JSON.parse(str.slice(startObj, endObj + 1));
  }
  
  throw new Error("Não foi possível encontrar um JSON válido na resposta.");
}

async function setupWithNeonCli() {
  try {
    console.log('⏳ Buscando projetos no Neon para obter a conexão...');
    
    // 1. Lista os projetos em formato JSON
    const listOutput = execSync('npx -y neonctl projects list --output json', { encoding: 'utf8' });
    const projectsList = parseJsonSafe(listOutput);
    
    // 2. Procura pelo projeto com nome 'gemini-chatbot'
    const project = projectsList.find(p => p.name === 'gemini-chatbot');
    
    if (!project) {
      console.log('ℹ️ Projeto "gemini-chatbot" não encontrado. Iniciando criação...');
      execSync('npx -y neonctl projects create --name gemini-chatbot', { stdio: 'inherit' });
      
      // Busca novamente para pegar o ID recém-criado
      const newListOutput = execSync('npx -y neonctl projects list --output json', { encoding: 'utf8' });
      const newProjectsList = parseJsonSafe(newListOutput);
      const newProject = newProjectsList.find(p => p.name === 'gemini-chatbot');
      
      if (!newProject) {
        throw new Error('Falha ao localizar o projeto "gemini-chatbot" após a criação.');
      }
      return saveConnection(newProject.id);
    }
    
    // Se encontrou, pega a conexão diretamente
    return saveConnection(project.id);

  } catch (error) {
    console.error('\n❌ Ocorreu um erro no processo com a Neon CLI:', error.message);
  }
}

function saveConnection(projectId) {
  console.log(`✅ Projeto localizado! ID do Neon: ${projectId}`);
  console.log('⏳ Obtendo a string de conexão...');
  
  const connOutput = execSync(`npx -y neonctl connection-string --project-id ${projectId}`, { encoding: 'utf8' });
  const rawConnectionUri = connOutput.trim();
  
  // Configura o pooling (?sslmode=require)
  const postgresUrl = rawConnectionUri.replace('postgresql://', 'postgres://') + '?sslmode=require';
  
  // Salva no .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  if (envContent.includes('POSTGRES_URL=')) {
    envContent = envContent.replace(/POSTGRES_URL=.*/, `POSTGRES_URL="${postgresUrl}"`);
  } else {
    envContent += `\nPOSTGRES_URL="${postgresUrl}"\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('💾 POSTGRES_URL salva com sucesso no arquivo .env.local!');
  console.log('\n🎉 Configuração concluída! Agora você pode rodar a migração com: pnpm tsx db/migrate');
}

setupWithNeonCli();
