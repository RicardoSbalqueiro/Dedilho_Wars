mergeInto(LibraryManager.library, {
  SenbukanExit: function () {
    window.parent.postMessage({ type: 'dedilho:senbukan-exit' }, window.location.origin);
  }
});
