// Setup global para todos os testes
// Jest executa este arquivo antes de cada test suite

// Limpa todos os mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Aumenta timeout para testes de integração
jest.setTimeout(30000);
