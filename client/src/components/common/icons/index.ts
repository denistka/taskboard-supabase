// Centralized icon component with switch case
export { default as Icon } from './Icon.vue'
export type { IconName } from './types'

// Wrapper components for backwards compatibility
import Icon from './Icon.vue'
import { defineComponent, h } from 'vue'
import type { IconName } from './types'

const createIconWrapper = (iconName: IconName): ReturnType<typeof defineComponent> => {
  // Convert to PascalCase: 'externalLink' -> 'IconExternalLink'
  const componentName = `Icon${iconName.charAt(0).toUpperCase() + iconName.slice(1)}`
  
  return defineComponent({
    name: componentName,
    props: {
      size: { type: [Number, String], default: 24 },
      strokeWidth: { type: Number, default: 2 }
    },
    setup(props) {
      return () => h(Icon, { ...props, name: iconName })
    }
  })
}

// Export all icon wrappers
export const IconPlus = createIconWrapper('plus')
export const IconEdit = createIconWrapper('edit')
export const IconTrash = createIconWrapper('trash')
export const IconBell = createIconWrapper('bell')
export const IconExternalLink = createIconWrapper('externalLink')
export const IconUserPlus = createIconWrapper('userPlus')
export const IconUser = createIconWrapper('user')
export const IconClock = createIconWrapper('clock')
export const IconArrowRight = createIconWrapper('arrowRight')
export const IconArrowLeft = createIconWrapper('arrowLeft')
export const IconClose = createIconWrapper('close')
export const IconLogout = createIconWrapper('logout')
export const IconSun = createIconWrapper('sun')
export const IconMoon = createIconWrapper('moon')
export const IconCheckCircle = createIconWrapper('checkCircle')
export const IconXCircle = createIconWrapper('xCircle')
export const IconExclamationTriangle = createIconWrapper('exclamationTriangle')
export const IconInfoCircle = createIconWrapper('infoCircle')
export const IconFileText = createIconWrapper('fileText')
