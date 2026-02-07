async function loadInclude(path, containerId) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error('Failed to load ' + path);
    const text = await res.text();
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = text;
  } catch (err) {
    console.error(err);
  }
}

loadInclude('includes/header.html', 'site-header');
loadInclude('includes/footer.html', 'site-footer');
