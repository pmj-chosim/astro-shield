import { readFile } from 'node:fs/promises'
import type {
	CSPDirectives,
	HashesCollection,
	SecurityHeadersOptions,
} from './types.mts'
import { serialiseCspDirectives, setSrcDirective } from './headers.mts'

type HeaderEntry = {
	headerName: string
	value: string
}

type CommentEntry = {
	comment: string
}

type NetlifyPathHeaders = {
	path: string
	entries: (CommentEntry | HeaderEntry)[]
}

type EmptyLine = ''

export type NetlifyHeadersRawConfig = {
	indentWith: string
	entries: (NetlifyPathHeaders | CommentEntry | EmptyLine)[]
}

const spacesRegex = /^\s+/
const headerRegex =
	/^(?<indent>\s*)(?<name>([a-zA-Z0-9_\-]+)):\s*(?<value>.*)$/i
const commentRegex = /^(?<indent>\s*)(?<comment>#.*)$/i

type ParseContext = {
	indentWith: string | undefined
	entries: NetlifyHeadersRawConfig['entries']
	currentPath: NetlifyPathHeaders | undefined
}

const tryToInitializePathConfig = (
	lineNum: number,
	line: string,
	ctx: ParseContext,
): void => {
	if (line === '') {
		ctx.entries.push(line)
	} else if (line.startsWith('#')) {
		ctx.entries.push({ comment: line })
	} else if (spacesRegex.test(line)) {
		throw new Error(`Unexpected indentation (line ${lineNum})`) // TODO: better error message, custom error
	} else if (line.startsWith('/')) {
		ctx.currentPath = { path: line, entries: [] }
		ctx.entries.push(ctx.currentPath)
	} else {
		throw new Error(`Bad syntax (line ${lineNum})`) // TODO: better error message, custom error
	}
}

const pushComment = (
	lineNum: number,
	match: RegExpMatchArray,
	currentPath: NetlifyPathHeaders | undefined,
): void => {
	if (match.groups?.comment === undefined) {
		throw new Error(`Bad syntax (line ${lineNum})`) // TODO: better error message, custom error
	}
	currentPath?.entries.push({ comment: match.groups.comment })
}

const pushHeader = (
	lineNum: number,
	match: RegExpMatchArray,
	currentPath: NetlifyPathHeaders | undefined,
): void => {
	if (match.groups?.name === undefined || match.groups?.value === undefined) {
		throw new Error(`Bad syntax (line ${lineNum})`) // TODO: better error message, custom error
	}

	currentPath?.entries.push({
		headerName: match.groups.name,
		value: match.groups.value,
	})
}

const pushEntry = (
	match: RegExpMatchArray,
	lineNum: number,
	line: string,
	pushLine: (
		lineNum: number,
		match: RegExpMatchArray,
		currentPath: NetlifyPathHeaders | undefined,
	) => void,
	ctx: ParseContext,
): void => {
	if (ctx.indentWith === undefined) {
		if (match.groups?.indent === undefined) {
			throw new Error(`Bad syntax (line ${lineNum})`) // TODO: better error message, custom error
		}
		if (match.groups?.indent === '') {
			throw new Error(`Unable to infer indentation (line ${lineNum})`) // TODO: better error message, custom error
		}
		ctx.indentWith = match.groups?.indent
	}

	if (match.groups?.indent === '') {
		if ((ctx.currentPath?.entries.length ?? 0) === 0) {
			throw new Error(`Bad syntax (line ${lineNum})`) // TODO: better error message, custom error
		}
		ctx.currentPath = undefined
		tryToInitializePathConfig(lineNum, line, ctx)
	} else if (match.groups?.indent !== ctx.indentWith) {
		throw new Error(`Unexpected indentation (line ${lineNum})`) // TODO: better error message, custom error
	} else {
		pushLine(lineNum, match, ctx.currentPath)
	}
}

const processPathLine = (
	lineNum: number,
	line: string,
	ctx: ParseContext,
): void => {
	let match: RegExpMatchArray | null = null

	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	if ((match = commentRegex.exec(line))) {
		pushEntry(match, lineNum, line, pushComment, ctx)
	}
	// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
	else if ((match = headerRegex.exec(line))) {
		pushEntry(match, lineNum, line, pushHeader, ctx)
	} else if (!spacesRegex.test(line)) {
		if ((ctx.currentPath?.entries.length ?? 0) === 0) {
			throw new Error(`Bad syntax (line ${lineNum})`) // TODO: better error message, custom error
		}
		ctx.currentPath = undefined
		tryToInitializePathConfig(lineNum, line, ctx)
	}
}

export const parseNetlifyHeadersConfig = (
	config: string,
): NetlifyHeadersRawConfig => {
	const ctx: ParseContext = {
		indentWith: undefined,
		entries: [],
		currentPath: undefined,
	}

	for (const [lineNum, line] of config.split('\n').entries()) {
		if (ctx.currentPath === undefined) {
			tryToInitializePathConfig(lineNum, line, ctx)
		} else {
			processPathLine(lineNum, line, ctx)
		}
	}

	return {
		indentWith: ctx.indentWith ?? '\t',
		entries: ctx.entries.at(-1) === '' ? ctx.entries.slice(0, -1) : ctx.entries,
	}
}

export const readNetlifyHeadersFile = async (
	path: string,
): Promise<NetlifyHeadersRawConfig> => {
	return parseNetlifyHeadersConfig(await readFile(path, 'utf8'))
}

export const serializeNetlifyHeadersConfig = (
	config: NetlifyHeadersRawConfig,
): string => {
	const indent = config.indentWith
	let result = ''

	for (const entry of config.entries) {
		if (entry === '') {
			result += '\n'
		} else if ('comment' in entry) {
			result += `${entry.comment}\n`
		} else if ('path' in entry) {
			result += `${entry.path}\n${entry.entries
				.map(e =>
					'comment' in e
						? `${indent}${e.comment}`
						: `${indent}${e.headerName}: ${e.value}`,
				)
				.join('\n')}\n`
		}
	}

	return result
}

export const buildNetlifyHeadersConfig = (
	securityHeadersOptions: SecurityHeadersOptions,
	resourceHashes: Pick<HashesCollection, 'perPageSriHashes'>,
): NetlifyHeadersRawConfig => {
	const config: NetlifyHeadersRawConfig = {
		indentWith: '\t',
		entries: [],
	}

	for (const [page, hashes] of resourceHashes.perPageSriHashes) {
		const entries: (HeaderEntry | CommentEntry)[] = []

		if (securityHeadersOptions.contentSecurityPolicy !== undefined) {
			const directives: CSPDirectives =
				securityHeadersOptions.contentSecurityPolicy.cspDirectives ?? {}

			if (hashes.scripts.size > 0) {
				setSrcDirective(directives, 'script-src', hashes.scripts)
			} else {
				directives['script-src'] = "'none'"
			}
			if (hashes.styles.size > 0) {
				setSrcDirective(directives, 'style-src', hashes.styles)
			} else {
				directives['style-src'] = "'none'"
			}

			if (Object.keys(directives).length === 0) {
				continue
			}

			entries.push({
				headerName: 'content-security-policy',
				value: serialiseCspDirectives(directives),
			})
		}

		if (entries.length > 0) {
			config.entries.push({ path: `/${page}`, entries })
		}
	}

	return config
}

// mergeNetlifyHeadersConfig: netlify headers config + netlify headers config -> netlify headers config
// patchNetlifyHeadersConfig: the orchestrator
