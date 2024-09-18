function isSitecoreExperienceEditor() {
  return !!(
    Sitecore &&
    Sitecore.PageModes &&
    Sitecore.PageModes.PageEditor
  );
}
