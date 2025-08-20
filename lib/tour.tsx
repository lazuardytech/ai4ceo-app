import { Tour } from 'nextstepjs';

const steps: Tour[] = [
  {
    tour: 'first-time',
    steps: [
      {
        icon: <>🤖</>,
        title: 'Customized Model for All You Need',
        content: <>
          Select a model that suits your needs. You can choose from various models, including specialized ones for different tasks.
        </>,
        selector: '#model-selector',
        side: 'top',
        showControls: true,
        // showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
        // nextRoute: '/',
        // prevRoute: '/bar',
      },
      {
        icon: <>📚</>,
        title: 'Multiple Experts for Specialized Tasks',
        content: <>
          Select experts to assist you with specific tasks. You can choose multiple experts for different areas of expertise.
        </>,
        selector: '#expert-selector-trigger',
        side: 'bottom',
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
        viewportID: 'scrollable-viewport',
      },
    ],
  },
];

export default steps;
