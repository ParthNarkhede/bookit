import heroImage from './hero.png'
import reactLogo from './react.svg'
import viteLogo from './vite.svg'
import roundTableLogo from './round-table.png'

export const images = {
    heroImage,
    reactLogo,
    viteLogo,
    roundTableLogo,
}

export const icons = {
    appLogo: viteLogo,
    frameworkLogo: reactLogo,
    bannerIcon: heroImage,
}

export const jsonObjects = {
    appMeta: {
        name: 'Bookit',
        version: '1.0.0',
        theme: 'light',
        locale: 'en-US',
    },
    bookingDefaults: {
        notes: 'No special requests',
        status: 'pending',
    },
    demoUsers: [
        { name: 'Jane Doe', email: 'jane@example.com' },
        { name: 'John Smith', email: 'john@example.com' },
    ],
}

export const enums = {
    BookingStatus: Object.freeze({
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        CANCELLED: 'cancelled',
    }),
    ThemeMode: Object.freeze({
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system',
    }),
}

const assets = {
    images,
    icons,
    jsonObjects,
    enums,
}

export default assets
