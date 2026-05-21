import { ISong } from '@/types/responses/song'
import { prefetch } from '@/utils/prefetch'
import { PrefetchAllButton } from './prefetch-all-button'

describe('PrefetchAllButton Component', () => {
  beforeEach(() => {
    prefetch.reset()
  })

  it('starts idle, enters running state on click, returns to idle when done', () => {
    cy.intercept('/rest/stream**', {
      statusCode: 206,
      delay: 300,
      body: '',
    }).as('stream')

    cy.fixture('songs/random').then((songs: ISong[]) => {
      cy.mount(<PrefetchAllButton songs={songs.slice(0, 3)} />)

      cy.get('button').as('button')
      cy.get('@button').find('.animate-spin').should('not.exist')

      cy.get('@button').click()
      cy.get('@button').find('.animate-spin').should('exist')

      cy.wait(['@stream', '@stream', '@stream'])
      cy.get('@button').find('.animate-spin').should('not.exist')
    })
  })

  it('cancels the running prefetch when clicked again', () => {
    cy.intercept('/rest/stream**', {
      statusCode: 206,
      delay: 2000,
      body: '',
    }).as('stream')

    cy.fixture('songs/random').then((songs: ISong[]) => {
      cy.mount(<PrefetchAllButton songs={songs.slice(0, 3)} />)

      cy.get('button').as('button')
      cy.get('@button').click()
      cy.get('@button').find('.animate-spin').should('exist')

      cy.get('@button').click()
      cy.get('@button').find('.animate-spin').should('not.exist')
    })
  })

  it('skips already-prefetched songs (shared dedup set)', () => {
    cy.intercept('/rest/stream**', {
      statusCode: 206,
      delay: 100,
      body: '',
    }).as('stream')

    cy.fixture('songs/random').then((songs: ISong[]) => {
      const subset = songs.slice(0, 3)

      cy.mount(<PrefetchAllButton songs={subset} />)
      cy.get('button').as('button')

      cy.get('@button').click()
      cy.wait(['@stream', '@stream', '@stream'])
      cy.get('@button').find('.animate-spin').should('not.exist')

      cy.get('@button').click()
      cy.get('@button').find('.animate-spin').should('not.exist')
    })
  })
})
