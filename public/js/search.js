const searchInput = document.getElementById('userSearch');
const userRows = document.querySelectorAll('tbody tr');

searchInput.addEventListener('input', () => {
  const searchText = searchInput.value.toLowerCase();

  userRows.forEach(userRow => {
    const userName = userRow
      .querySelector('.userName')
      .textContent.toLowerCase();

    if (userName.includes(searchText)) {
      userRow.style.display = '';
    } else {
      userRow.style.display = 'none';
    }
  });
});



