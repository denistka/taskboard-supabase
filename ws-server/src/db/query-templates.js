/**
 * GraphQL Query Templates
 * For client-side GraphQL operations via Supabase
 */

export const QUERY_TEMPLATES = {
  BOARD: {
    GET_BY_ID: `
      query GetBoard($boardId: UUID!) {
        boardsCollection(filter: { id: { eq: $boardId } }) {
          edges {
            node {
              id
              name
              description
              created_by
              created_at
              updated_at
            }
          }
        }
      }
    `,
    
    GET_BY_USER: `
      query GetUserBoards($userId: UUID!) {
        boardsCollection(filter: { created_by: { eq: $userId } }) {
          edges {
            node {
              id
              name
              description
              created_by
              created_at
              updated_at
            }
          }
        }
      }
    `,
    
    GET_OR_CREATE: `
      query GetUserBoard($userId: UUID!) {
        boardsCollection(filter: { created_by: { eq: $userId } }, first: 1) {
          edges {
            node {
              id
              name
              description
              created_by
              created_at
              updated_at
            }
          }
        }
      }
    `,
    
    CREATE: `
      mutation CreateBoard($input: boardsInsertInput!) {
        insertIntoboardsCollection(objects: [$input]) {
          records {
            id
            name
            description
            created_by
            created_at
            updated_at
          }
        }
      }
    `,
    
    UPDATE: `
      mutation UpdateBoard($id: UUID!, $updates: boardsUpdateInput!) {
        updateboardsCollection(filter: { id: { eq: $id } }, set: $updates) {
          records {
            id
            name
            description
            created_by
            updated_at
          }
        }
      }
    `,
    
    DELETE: `
      mutation DeleteBoard($id: UUID!) {
        deleteFromboardsCollection(filter: { id: { eq: $id } }) {
          records {
            id
          }
        }
      }
    `
  },

  TASK: {
    GET_BY_BOARD: `
      query GetTasks($boardId: UUID!) {
        tasksCollection(filter: { board_id: { eq: $boardId } }, orderBy: { position: ASC }) {
          edges {
            node {
              id
              title
              description
              status
              position
              created_at
              updated_at
              board_id
              assigned_to
              created_by
              profiles {
                id
                email
                full_name
                avatar_url
              }
            }
          }
        }
      }
    `,
    
    CREATE: `
      mutation CreateTask($input: tasksInsertInput!) {
        insertIntotasksCollection(objects: [$input]) {
          records {
            id
            title
            description
            status
            position
            created_at
            updated_at
            board_id
            assigned_to
            created_by
            profiles {
              id
              email
              full_name
              avatar_url
            }
          }
        }
      }
    `,
    
    UPDATE: `
      mutation UpdateTask($id: UUID!, $updates: tasksUpdateInput!) {
        updatetasksCollection(filter: { id: { eq: $id } }, set: $updates) {
          records {
            id
            title
            description
            status
            position
            updated_at
            board_id
            assigned_to
            created_by
            profiles {
              id
              email
              full_name
              avatar_url
            }
          }
        }
      }
    `,
    
    DELETE: `
      mutation DeleteTask($id: UUID!) {
        deleteFromtasksCollection(filter: { id: { eq: $id } }) {
          records {
            id
          }
        }
      }
    `,
    
    MOVE: `
      mutation MoveTasks($moves: [tasksUpdateInput!]!) {
        updatetasksCollection(set: $moves) {
          records {
            id
            position
            status
            updated_at
          }
        }
      }
    `
  },

  USER: {
    GET_PROFILE: `
      query GetUserProfile($userId: UUID!) {
        profilesCollection(filter: { id: { eq: $userId } }) {
          edges {
            node {
              id
              email
              full_name
              avatar_url
              created_at
            }
          }
        }
      }
    `,
    
    CREATE_PROFILE: `
      mutation CreateProfile($input: profilesInsertInput!) {
        insertIntoprofilesCollection(objects: [$input]) {
          records {
            id
            email
            full_name
            avatar_url
            created_at
          }
        }
      }
    `,
    
    UPDATE_PROFILE: `
      mutation UpdateProfile($id: UUID!, $updates: profilesUpdateInput!) {
        updateprofilesCollection(filter: { id: { eq: $id } }, set: $updates) {
          records {
            id
            email
            full_name
            avatar_url
            created_at
          }
        }
      }
    `
  }
}

/**
 * Universal template resolver (KISS)
 * If template doesn't exist → throw error
 */
export function getQueryTemplate(template, action) {
  const templateGroup = QUERY_TEMPLATES[template.toUpperCase()]
  if (!templateGroup) {
    throw new Error(`No template group found: ${template}`)
  }
  
  const query = templateGroup[action.toUpperCase()]
  if (!query) {
    throw new Error(`No query found for ${template}.${action}`)
  }
  
  return query
}
