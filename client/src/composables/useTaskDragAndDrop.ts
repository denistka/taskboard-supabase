import { ref } from 'vue'
import type { Task } from '../../../shared/types'

export function useTaskDragAndDrop(
  status: string,
  tasks: () => Task[],
  onTaskMoved: (taskId: string, newStatus: string, newPosition: number) => void
) {
  const draggedTaskId = ref<string | null>(null)
  const isDragOver = ref(false)
  const dropIndicatorIndex = ref<number | null>(null)
  const ghostElement = ref<HTMLElement | null>(null)

  const handleDragStart = (task: Task, event: DragEvent) => {
    if (!event.dataTransfer) return
    
    draggedTaskId.value = task.id
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    
    // Create custom drag image with rotation
    const target = event.target as HTMLElement
    const clone = target.cloneNode(true) as HTMLElement
    clone.style.transform = ''
    clone.style.opacity = '0.8'
    clone.style.position = 'absolute'
    clone.style.top = '-9999px'
    document.body.appendChild(clone)
    ghostElement.value = clone
    
    event.dataTransfer.setDragImage(clone, event.offsetX, event.offsetY)
    
    // Add dragging class and ghost effect to original element
    setTimeout(() => {
      target.classList.add('dragging')
      target.style.opacity = '0.3'
    }, 0)
  }

  const handleDragEnd = (event: DragEvent) => {
    const target = event.target as HTMLElement
    target.classList.remove('dragging')
    target.style.opacity = '1'
    
    // Clean up ghost element
    if (ghostElement.value) {
      document.body.removeChild(ghostElement.value)
      ghostElement.value = null
    }
    
    draggedTaskId.value = null
    isDragOver.value = false
    dropIndicatorIndex.value = null
  }

  const getDropPosition = (event: DragEvent, container: HTMLElement): number => {
    const taskElements = Array.from(container.querySelectorAll('[data-task-id]'))
    const y = event.clientY
    
    for (let i = 0; i < taskElements.length; i++) {
      const element = taskElements[i] as HTMLElement
      const rect = element.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      
      if (y < midpoint) {
        return i
      }
    }
    
    return taskElements.length
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (!event.dataTransfer) return
    
    event.dataTransfer.dropEffect = 'move'
    isDragOver.value = true
    
    // Calculate and show drop position indicator
    const target = event.currentTarget as HTMLElement
    const position = getDropPosition(event, target)
    dropIndicatorIndex.value = position
  }

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault()
    isDragOver.value = true
  }

  const handleDragLeave = (event: DragEvent) => {
    // Only remove drag-over if we're leaving the column entirely
    const target = event.currentTarget as HTMLElement
    const relatedTarget = event.relatedTarget as HTMLElement
    
    if (!relatedTarget || !target.contains(relatedTarget)) {
      isDragOver.value = false
      dropIndicatorIndex.value = null
    }
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    
    if (!event.dataTransfer) return
    
    const taskId = event.dataTransfer.getData('text/plain')
    if (!taskId) return
    
    // Use the calculated drop position
    const newPosition = dropIndicatorIndex.value ?? tasks().length
    
    // Emit the taskMoved event (even if same column, to allow reordering)
    onTaskMoved(taskId, status, newPosition)
    
    // Clean up
    isDragOver.value = false
    dropIndicatorIndex.value = null
    draggedTaskId.value = null
  }

  return {
    draggedTaskId,
    isDragOver,
    dropIndicatorIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  }
}

