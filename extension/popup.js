document.addEventListener('DOMContentLoaded', function() {
  // Check if the extension is properly connected
  const statusElement = document.getElementById('status');
  const statusTextElement = document.getElementById('status-text');
  
  // Here we could add real checks for connection status
  // For now we'll just simulate an active extension
  const isActive = true;
  
  if (isActive) {
    statusElement.classList.add('active');
    statusTextElement.textContent = 'Active';
  } else {
    statusElement.classList.remove('active');
    statusTextElement.textContent = 'Inactive';
  }
});