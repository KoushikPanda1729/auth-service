# Express Project Initial Setup Checklist

## Setup Tasks

- [ Done ] Git setup
- [ Done ] Node.js version manager setup [nvm install (if not install) , nvm use (this command use the .nvmrc version)]
- [ Done ] Node.js project setup [npm init]
- [ Done ] TypeScript setup [npm i -D typescript,npx tsc --init(create tsconfig.js) , npm i -D @types/node ]
- [ Done ] Prettier setup [ npm install --save-dev --save-exact prettier , npx prettier . --write ]
- [ Done ] Eslint setup [npm install --save-dev eslint @eslint/js typescript-eslint , "lint:fix": "npx eslint . --fix",
  "lint:check": "npx eslint ."]
- [ Done ] Git hooks setup [npm install --save-dev husky ,npx husky init , npm install --save-dev lint-staged (Used for only staged file checked) ]
- [ Done ] Application config setup [npm i dotenv]
- [ Done ] Express.js app setup
- [ Done ] Logger setup [npm i winston , and the order is like this ({
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
  })]

- [ ] Error handling setup
- [ ] Tests setup
- [ ] Create template

## Progress Tracking

Use this checklist to track your progress while setting up the Express.js authentication service project.

Check off items as you complete them to maintain visibility of what's done and what remains.
