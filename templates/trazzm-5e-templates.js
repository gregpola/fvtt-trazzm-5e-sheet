/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 
export const preloadTrazzm5eHandlebarsTemplates = async function() {

  // Define template paths to load
  const trazzm5etemplatePaths = [

    // Actor Sheet Partials
    "modules/trazzm-5e-sheet/templates/parts/trazzm-5e-traits.html",
    "modules/trazzm-5e-sheet/templates/parts/trazzm-5e-inventory.html",
    "modules/trazzm-5e-sheet/templates/parts/trazzm-5e-features.html",
    "modules/trazzm-5e-sheet/templates/parts/trazzm-5e-spellbook.html",
    "modules/trazzm-5e-sheet/templates/parts/trazzm-5e-biography.html",
    "modules/trazzm-5e-sheet/templates/parts/trazzm-5e-journal.html"

  ];

  // Load the template parts
  return loadTemplates(trazzm5etemplatePaths);
};