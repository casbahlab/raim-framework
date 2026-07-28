# Responsible AI Music (RAIM) Initiative

[![Website](https://img.shields.io/badge/Website-Live-brightgreen.svg)](https://casbahlab.github.io/raim-initiative)

This repository hosts the website and resources for the Responsible AI Music (RAIM) initiative. RAIM is a collaborative effort to define, expand, and monitor requirements for generative music AI, ensuring the future of music creation aligns with Trustworthy AI principles.

## Repository Structure

*   **`index.html`:** The website's homepage — background, the 7 Trustworthy AI pillars, and the 45 RAIM features. Pillar headings, intros, and feature cards are rendered at runtime from `data/features.json`; clicking a card opens its full description in a shared modal.
*   **`evaluation.html`:** An interactive explorer for the RAIM Delphi study results — per-pillar radar charts comparing how each stakeholder group (AI/Technology, Artists, Ethics, Law) rated feature importance, and a Stage 1 → Stage 2 consensus view. Clicking a feature (in the radar, the consensus chart, or either table view) opens the same shared description modal as `index.html`.
*   **`style.css`:** Shared site-wide styles (nav, cards, the feature-description modal, section layout).
*   **`css/evaluation.css`:** Styles specific to `evaluation.html`'s charts and controls.
*   **`data/features.json`:** The canonical content for all 7 pillars and 45 features (name, brief, facet, full description). Generated and maintained in the private `raim-analysis` repo and committed here as a build artifact — don't hand-edit; regenerate from there.
*   **`js/features-data.js`:** `data/features.json` wrapped as a browser-loadable script (generated — don't hand-edit).
*   **`js/feature-modal.js`:** The shared feature-detail modal used by both `index.html` and `evaluation.html`.
*   **`js/render-features.js`:** Renders `index.html`'s pillar sections and feature cards from `js/features-data.js`.
*   **`js/evaluation-data.js`:** The Delphi study's statistics (per-group feature importance, Stage 1 → Stage 2 consensus) as a browser-loadable script. Generated from the study data in the private `raim-analysis` repo (don't hand-edit).
*   **`js/evaluation.js`:** The radar charts and consensus explorer on `evaluation.html`.
*   **`assets/`:** Images and other media files.
*   **`README.md`:** This file, providing an overview of the project.
*   **(Optional Folders - for future expansion):**
    *   `features/`:  For a more structured descriptions of the RAIM features.
    *   `examples/`: For showcasing examples of annotated Generative Music AIs.
    *   `templates/`: For any resource developed as part of the initiative.

## Contributing to the initiative

If you'd like to contribute to the website's code (e.g., improve the design, fix bugs, or add content), please follow these steps:

1.  **Fork** the repository.
2.  Create a new **branch** for your changes (`git checkout -b feature/your-feature-name`).
3.  Make your changes and **commit** them with clear, descriptive messages.
4.  **Push** your branch to your forked repository.
5.  Submit a **pull request** to the main RAIM repository.

To propose **feature edits**, **improvements**, **documentation**, or even **new features**, we use an issue-based system. Please follow these steps:

1. **Open an Issue:** Navigate to the "Issues" tab in the repository and click on "New Issue". Provide a clear and detailed description of your proposal.
2. **Discuss:** Engage with the community and maintainers in the issue comments to refine your idea.
3. **Implement:** Once the proposal is approved, you can start working on it. Fork the repository, create a new branch, and make your changes (as before).
4. **Submit a Pull Request:** Push your branch to your forked repository and submit a pull request referencing the issue number.

We will review your pull request and provide feedback.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
