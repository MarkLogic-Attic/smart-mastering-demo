# Smart Mastering Demo

## Steps to run the Smart Mastering Demo

- `cd ml-data-hub-plugin`
- `gradle build -x test`
- `gradle publishToMavenLocal`
- `cd ..`
- `gradle publishToMavenLocal`
- `cd examples/smart-mastering`
- `gradle build`
- `gradle mlDeploy`
- `gradle prepDemo`
- from your project home: `gradle bootrun`
- from your project home: `gradle runui`
