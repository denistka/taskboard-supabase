/**
 * Universal Query Templates (KISS Architecture)
 * 
 * Single source of truth for all database operations
 * Client sends: { type: ['db'], template: 'board', action: 'get', payload: {...} }
 * 
 * This file serves as the main entry point and re-exports all template types
 */

// Import all template types
export { SQL_TEMPLATES } from './sql-templates.js'
export { QUERY_TEMPLATES, getQueryTemplate } from './query-templates.js'
export { BATCH_TEMPLATES } from './batch-templates.js'

// Re-export everything for backward compatibility
export * from './sql-templates.js'
export * from './query-templates.js'
export * from './batch-templates.js'