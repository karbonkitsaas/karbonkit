// MPOB/FMM Guidelines Browser
// This script provides a browsing feature for MPOB/FMM guidelines

const guidelines = [
  { title: 'MPOB Guideline 1', link: 'https://mpob.gov.my/guideline1' },
  { title: 'FMM Guideline 1', link: 'https://fmm.org.my/guideline1' },
];

function browseGuidelines() {
  guidelines.forEach(guideline => {
    console.log(`Title: ${guideline.title}, Link: ${guideline.link}`);
  });
}

// Add search and filter functionality for guidelines
function searchGuidelines(query) {
  const results = guidelines.filter(guideline => guideline.title.toLowerCase().includes(query.toLowerCase()));
  console.log('Search Results:', results);
}

// Example usage
searchGuidelines('MPOB');

browseGuidelines();