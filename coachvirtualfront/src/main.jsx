import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Parche global para evitar que los traductores automáticos (como Google Translate)
// rompan el árbol DOM de React al cambiar el estado y desmontar componentes.
if (typeof Node !== 'undefined' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (child.parentNode && child.parentNode.tagName === 'FONT') {
        try {
          return originalRemoveChild.call(child.parentNode.parentNode, child.parentNode)
        } catch (e) {
          console.warn('removeChild: falló remoción del nodo FONT traducido', e)
        }
      }
      console.warn('removeChild: el nodo hijo no pertenece a este padre, previniendo crash.', child, this)
      return child
    }
    return originalRemoveChild.call(this, child)
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode && referenceNode.parentNode.tagName === 'FONT') {
        try {
          return originalInsertBefore.call(referenceNode.parentNode.parentNode, newNode, referenceNode.parentNode)
        } catch (e) {
          console.warn('insertBefore: falló inserción antes del nodo FONT traducido', e)
        }
      }
      console.warn('insertBefore: el nodo de referencia no pertenece a este padre, insertando al final.', newNode, referenceNode, this)
      return originalInsertBefore.call(this, newNode, null)
    }
    return originalInsertBefore.call(this, newNode, referenceNode)
  }
}

createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <App />
  </React.Fragment>
)
