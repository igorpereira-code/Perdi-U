describe('Pantalla principal', () => {
  it('muestra el nombre de la app', () => {
    cy.visit('/');
    cy.contains('h1', 'Perdi-U');
  });
});
