document.addEventListener('DOMContentLoaded', function() {
  // Check if the extension is properly connected
  const statusElement = document.getElementById('status');
  const statusTextElement = document.getElementById('status-text');
  
  if (!statusElement || !statusTextElement) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // For now, always show as active
  // In a real implementation, we could check if communication with the web app is working
  const isActive = true;
  
  if (isActive) {
    statusElement.classList.add('active');
    statusTextElement.textContent = 'Active';
  } else {
    statusElement.classList.remove('active');
    statusTextElement.textContent = 'Inactive';
  }
});