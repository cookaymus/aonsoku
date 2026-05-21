import { useAppStore } from '@/store/app.store'
import { PrefetchSettings } from './prefetch'

describe('PrefetchSettings Component', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      pages: { ...state.pages, prefetchNextTrackEnabled: true },
    }))
  })

  it('renders the toggle in the on state by default', () => {
    cy.mount(<PrefetchSettings />)
    cy.get('[role="switch"]').should('have.attr', 'data-state', 'checked')
  })

  it('flips the store state when the toggle is clicked', () => {
    cy.mount(<PrefetchSettings />)
    cy.get('[role="switch"]').click()
    cy.get('[role="switch"]').should('have.attr', 'data-state', 'unchecked')
    cy.wrap(null).then(() => {
      expect(
        useAppStore.getState().pages.prefetchNextTrackEnabled,
      ).to.equal(false)
    })
  })

  it('persists the toggle state to localStorage', () => {
    cy.mount(<PrefetchSettings />)
    cy.get('[role="switch"]').click()
    cy.wrap(null).then(() => {
      const stored = JSON.parse(localStorage.getItem('app_store') || '{}')
      expect(stored.state.pages.prefetchNextTrackEnabled).to.equal(false)
    })
  })
})
