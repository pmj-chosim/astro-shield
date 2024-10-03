<!--
SPDX-FileCopyrightText: 2024 KindSpells Labs S.L.

SPDX-License-Identifier: CC-BY-4.0
-->
# Astro-Shield

[![NPM Version](https://img.shields.io/npm/v/%40kindspells%2Fastro-shield)](https://www.npmjs.com/package/@kindspells/astro-shield)
![NPM Downloads](https://img.shields.io/npm/dw/%40kindspells%2Fastro-shield)
![GitHub commit activity](https://img.shields.io/github/commit-activity/w/kindspells/astro-shield)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/kindspells/astro-shield/tests.yml)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@kindspells/astro-shield)](https://socket.dev/npm/package/@kindspells/astro-shield)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/8733/badge)](https://www.bestpractices.dev/projects/8733)

## 소개

Astro-Shield는 Astro 사이트의 보안을 강화하는 도구입니다.  

## 설치 방법

```bash
# NPM으로 설치
npm install --save-dev @kindspells/astro-shield

# Yarn으로 설치
yarn add --dev @kindspells/astro-shield

# PNPM으로 설치
pnpm add --save-dev @kindspells/astro-shield
```

## 사용 방법

`astro.config.mjs` 파일에서:

```javascript
import { defineConfig } from 'astro/config'
import { shield } from '@kindspells/astro-shield'

export default defineConfig({
  integrations: [
    shield({})
  ]
})
```

## 자세히 알아보기

- [Astro-Shield 문서](https://astro-shield.kindspells.dev)

## 기타 관련 지침

- [행동 강령](https://github.com/KindSpells/astro-shield?tab=coc-ov-file)
- [기여 지침](https://github.com/KindSpells/astro-shield/blob/main/CONTRIBUTING.md)
- [보안 정책](https://github.com/KindSpells/astro-shield/security/policy)

## 주요 기여자

이 라이브러리는 다음 기여 단체에 의해 만들어졌으며, 해당 단체가 유지 관리하고 있습니다.
[KindSpells Labs](https://kindspells.dev/?utm_source=github&utm_medium=astro_sri_scp&utm_campaign=floss).

## 라이선스

이 라이브러리는 [MIT License](https://github.com/KindSpells/astro-shield?tab=MIT-1-ov-file)를 따릅니다.
