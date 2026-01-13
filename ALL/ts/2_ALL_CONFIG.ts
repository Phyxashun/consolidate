

//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./.gitignore ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■




# dependencies (bun install)
node_modules

# output
out
dist
*.tgz

# code coverage
coverage
*.lcov

# logs
logs
_.log
report.[0-9]_.[0-9]_.[0-9]_.[0-9]_.json

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# caches
.eslintcache
.cache
*.tsbuildinfo

# IntelliJ based IDEs
.idea

# Finder (MacOS) folder config
.DS_Store





//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./.gitignore ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./package.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■





{
  "name": "consolidate",
  "module": "index.ts",
  "type": "module",
  "devDependencies": {
    "@types/bun": "^1.3.5",
    "@types/figlet": "^1.7.0",
    "@types/node": "^25.0.6",
    "@types/progress": "^2.0.7"
  },
  "peerDependencies": {
    "typescript": "^5"
  },
  "dependencies": {
    "figlet": "^1.9.4",
    "progress": "^2.0.3",
    "logger": "link:logger"
  },
  "bin": {
    "consolidate": "./index.ts"
  },
  "scripts": {
    "start": "bun run ./index.ts"
  }
}




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./package.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████


//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ Start of file: ./tsconfig.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■





{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}




//■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ End of file: ./tsconfig.json ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■


//████████████████████████████████████████████████████████████████████████████████████████████████████
//████████████████████████████████████████████████████████████████████████████████████████████████████
