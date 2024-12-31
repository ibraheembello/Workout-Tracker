// ...existing code...

const options = {
  definition: {
    // ...existing code...
    components: {
      schemas: {
        Exercise: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            category_id: { type: 'integer' }
          }
        },
        WorkoutPlan: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            exercises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  exerciseId: { type: 'integer' },
                  sets: { type: 'integer' },
                  reps: { type: 'integer' },
                  weight: { type: 'number' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
};

// ...existing code...
