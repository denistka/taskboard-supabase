<template>
    <div class="w-full h-screen overflow-hidden">
  
      <div class="fixed inset-0 z-0">
        <slot name="bg"></slot>
      </div>
  
      <header class="fixed top-0 w-full h-14 z-40">
        <slot name="header"></slot>
      </header>

      <main class="relative w-full h-screen items-center justify-center overflow-y-auto overflow-x-hidden z-10">
        <slot name="page-view-content"></slot>
      </main>

      <footer class="fixed bottom-0 w-full h-14 z-40">
        <slot name="footer"></slot>
      </footer>
  
      <div class="fixed w-full h-0 bottom-0 z-50">
        <slot name="notifications"></slot>
      </div>
  
    </div>
  </template>
  