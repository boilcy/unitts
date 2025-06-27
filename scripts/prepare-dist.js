#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取主 package.json
const mainPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 创建 dist package.json
const distPackageJson = {
  name: mainPackageJson.name,
  version: mainPackageJson.version,
  description: mainPackageJson.description,
  author: mainPackageJson.author,
  license: mainPackageJson.license,
  keywords: mainPackageJson.keywords,
  main: 'index.js',
  types: 'index.d.ts',
  files: ['**/*'],
  dependencies: mainPackageJson.dependencies || {},
  repository: mainPackageJson.repository,
  bugs: mainPackageJson.bugs,
  homepage: mainPackageJson.homepage,
};

// 确保 dist 目录存在
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// 写入 dist/package.json
fs.writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));

// 复制 README.md 到 dist
if (fs.existsSync('README.md')) {
  fs.copyFileSync('README.md', 'dist/README.md');
}

// 复制 CHANGELOG.md 到 dist（如果存在）
if (fs.existsSync('CHANGELOG.md')) {
  fs.copyFileSync('CHANGELOG.md', 'dist/CHANGELOG.md');
}

console.log('✅ dist 目录已准备完成');
