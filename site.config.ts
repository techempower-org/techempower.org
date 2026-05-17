import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '0959e44599984143acabc80187305001',

  // restrict to TechEmpower workspace
  rootNotionSpaceId: undefined,

  // basic site info (required)
  name: 'TechEmpower',
  domain: 'techempower.org',
  author: 'TechEmpower',

  // open graph metadata
  description:
    'Technology for All: Access Made Easy. Free technology resources for individuals with low income, their families, and nonprofit organizations.',

  // social usernames
  twitter: undefined,
  github: undefined,
  linkedin: undefined,

  // default notion icon and cover images
  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // LQIP preview images — disabled on Cloudflare Workers (requires `sharp` native binary)
  isPreviewImageSupportEnabled: false,

  // no Redis on Cloudflare Pages
  isRedisEnabled: false,

  // map of notion page IDs to URL paths
  pageUrlOverrides: {
    // Guide pages
    '/guides/how-to-use-techempower': '6c979ba4e43f48d7a4836e0027ea4178',
    '/guides/free-internet': 'bb5e537b083a417eb90ed9e984128c71',
    '/guides/ev-incentives': '758054e1a2ec4c1aa077202ffedec710',
    '/guides/ebt-balance': '272a4ee69520804fa68ad8c110af49f6',
    '/guides/ebt-spending': '16f7018ad9354265a2b216c44464b1c3',
    '/guides/findhelp': '992742a61e2e472b9b4a149f7aa74539',
    '/guides/password-manager': '99b0ab9c7cce428e8c86e3143752aa1c',
    '/guides/free-cell-service': '7519ef16d7b74519acd9b8262a7beb84',

    // Resources database
    '/resources': '2a3d706803c649409e74e9ce5ccd4c4b',

    // Storyvox app landing page
    '/storyvox': '363a4ee6952081e48184f03b153b4a8d',

    // About pages
    '/about': 'dbf0ddece2ce468fb2bf9049e6322e8a',
    '/donate': '59d8a4dab0cc484f8b044d33f240ce1d',
    '/non-discrimination-policy': 'cdbe9906ae2441a1a9bb3aec601a5a6c',
    '/privacy-policy': '363a4ee6952081b28996c0c05280ce18',
    '/privacy': '363a4ee6952081b28996c0c05280ce18'
  },

  // custom navigation
  navigationStyle: 'custom',
  navigationLinks: [
    {
      title: 'Guides',
      pageId: '0959e44599984143acabc80187305001'
    },
    {
      title: 'Resources',
      pageId: '2a3d706803c649409e74e9ce5ccd4c4b'
    },
    {
      title: 'Storyvox',
      pageId: '363a4ee6952081e48184f03b153b4a8d'
    },
    {
      title: 'About',
      pageId: 'dbf0ddece2ce468fb2bf9049e6322e8a'
    },
    {
      title: 'Donate',
      pageId: '59d8a4dab0cc484f8b044d33f240ce1d'
    }
  ]
})
