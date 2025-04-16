describe('Flight Finder App', () => {
  beforeEach(() => {
    // Mock the extension status check
    cy.intercept('POST', '/api/agent', {
      fixture: 'mockAgentResponse.json',
    }).as('agentCall');
    
    // Load the application
    cy.visit('/');
  });

  it('should display the main header correctly', () => {
    cy.contains('Flight Finder Agent').should('be.visible');
    cy.contains('Your AI-powered assistant for finding the perfect flights').should('be.visible');
  });

  it('should allow entering a search query', () => {
    const searchQuery = 'Flight from NYC to London next weekend';
    cy.get('input[placeholder*="Find me a flight"]').type(searchQuery);
    cy.get('button').contains('Search Flights').click();
    cy.wait('@agentCall');
    cy.contains('Agent Status').should('be.visible');
  });

  it('shows error message when API fails', () => {
    // Override the successful intercept with an error response
    cy.intercept('POST', '/api/agent', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('apiError');
    
    const searchQuery = 'Flight from NYC to London next weekend';
    cy.get('input[placeholder*="Find me a flight"]').type(searchQuery);
    cy.get('button').contains('Search Flights').click();
    cy.wait('@apiError');
    
    // Check that error message is displayed
    cy.contains('Error').should('be.visible');
    cy.contains('Server error').should('be.visible');
  });
});