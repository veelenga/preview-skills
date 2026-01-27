### Code style

After each code change validate yourself:

`npm run format` # validate formatting
`npm run test` # run tests

### Adding new examples

Examples are showcased on the GitHub Pages website. When adding a new example file to the `examples/` folder:

1. **Add the example file** to the appropriate subfolder (e.g., `examples/json/logs.jsonl`)
2. **Update `scripts/generate-docs.sh`** - add a `generate_example` call for the new file
3. **Update `docs/index.html`** - add a link to the new example in the corresponding skill card
4. **Run `./scripts/generate-docs.sh`** - regenerate all documentation examples
5. **Update README.md** (if applicable) - add the new example to the examples section
