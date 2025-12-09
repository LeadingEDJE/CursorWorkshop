"Implement a feature to preload the first 2 product images in the HTML <head> section using <link rel="preload"> tags. This should:
1. Add a new GraphQL query in the dataService that takes a productId and optional faceout, returning a response with success status and the image URLs to preload. Use the existing product list API for efficiency rather than fetching full collection data.
2. Create a React component in webService that renders the preload link tags, including a data-productid attribute for debugging
3. Register a new MicroRouter instance for this feature (similar to how other routers are set up in app.jsx), and add it to the /head endpoint component map
4. Include appropriate tests"