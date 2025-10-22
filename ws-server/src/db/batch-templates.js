/**
 * Batch Operation Templates
 * For bulk operations and complex multi-record operations
 */

export const BATCH_TEMPLATES = {
  TASKS_CREATE: `
    mutation CreateTasks($tasks: [tasksInsertInput!]!) {
      insertIntotasksCollection(objects: $tasks) {
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
  
  TASKS_UPDATE: `
    mutation UpdateTasks($updates: [tasksUpdateInput!]!) {
      updatetasksCollection(set: $updates) {
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
  
  TASKS_DELETE: `
    mutation DeleteTasks($taskIds: [UUID!]!) {
      deleteFromtasksCollection(filter: { id: { in: $taskIds } }) {
        records {
          id
        }
      }
    }
  `,
  
  TASKS_MOVE: `
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
  `,
  
  BOARDS_CREATE: `
    mutation CreateBoards($boards: [boardsInsertInput!]!) {
      insertIntoboardsCollection(objects: $boards) {
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
  
  BOARDS_UPDATE: `
    mutation UpdateBoards($updates: [boardsUpdateInput!]!) {
      updateboardsCollection(set: $updates) {
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
  
  PROFILES_CREATE: `
    mutation CreateProfiles($profiles: [profilesInsertInput!]!) {
      insertIntoprofilesCollection(objects: $profiles) {
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
  
  PROFILES_UPDATE: `
    mutation UpdateProfiles($updates: [profilesUpdateInput!]!) {
      updateprofilesCollection(set: $updates) {
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
