/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 
export const preloadTrazzm5eHandlebarsTemplates = async function() {

  // Define template paths to load
  const trazzm5etemplatePaths = [

    // Actor Sheet Partials
    "modules/trazzm-5e-sheet/templates/npc-parts/trazzm-5e-npc-traits.html",
    "modules/trazzm-5e-sheet/templates/npc-parts/trazzm-5e-npc-features.html",
    "modules/trazzm-5e-sheet/templates/npc-parts/trazzm-5e-npc-spellbook.html"
  ];

  // Load the template parts
  return loadTemplates(trazzm5etemplatePaths);
};