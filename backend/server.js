const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', message: 'Backend está rodando!' }));
    return;
  }
  
  // Admin login
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      token: 'token_admin_xyz123',
      admin: { id: 1, email: 'admin@example.com', nome: 'Administrador' }
    }));
    return;
  }
  
  // Empresa login
  if (pathname === '/api/empresa/login' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({
      token: 'token_empresa_xyz123',
      empresa: { id: 1, email: 'empresa@example.com', nome: 'Minha Empresa' }
    }));
    return;
  }
  
  // Get product with logo and banner
  if (pathname === '/api/cliente/produto/1') {
    res.writeHead(200);
    res.end(JSON.stringify({
      id: 1,
      nome: 'Produto Demo',
      logo: 'https://via.placeholder.com/150x150?text=Logo',
      banner: 'https://via.placeholder.com/800x200?text=Banner',
      descricao: 'Produto de demonstração do SaaS'
    }));
    return;
  }
  
  // List empresas for admin
  if (pathname === '/api/admin/empresas' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      empresas: [
        { id: 1, nome: 'Empresa 1', email: 'empresa1@test.com' },
        { id: 2, nome: 'Empresa 2', email: 'empresa2@test.com' }
      ]
    }));
    return;
  }
  
  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint não encontrado', path: pathname }));
});

server.listen(3001, () => {
  console.log('✅ Backend rodando em http://localhost:3001');
  console.log('✅ GET  http://localhost:3001/health');
  console.log('✅ POST http://localhost:3001/api/admin/login');
  console.log('✅ POST http://localhost:3001/api/empresa/login');
  console.log('✅ GET  http://localhost:3001/api/cliente/produto/1');
});
