// Variables globales
let cart = [];
let isLoggedIn = false;
let currentUser = null;
let currentGameData = null;

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA8pmCj75_X_3dY-687gb23kXmCr5nqKgo",
  authDomain: "playstation-store-b81cb.firebaseapp.com",
  projectId: "playstation-store-b81cb",
  storageBucket: "playstation-store-b81cb.firebasestorage.app",
  messagingSenderId: "284724171611",
  appId: "1:284724171611:web:fce6bff4c39e09044fc07e"
};

// Inicializar Firebase si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Base de datos de juegos
const gamesDatabase = {
    'spider-man-2': {
        title: 'Marvel\'s Spider-Man 2',
        developer: 'Insomniac Games',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/49ac4dcbd03f3f39085f257edefb5d0d.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png',
        video: '../videos/spidermancorto.mp4',
        platforms: ['PS5'],
        releaseDate: '20/10/2023',
        trademark: 'Marvel\'s Spider-Man 2 es una marca registrada de Marvel Entertainment, LLC.',
        description: {
            title: 'DESCRIPCIÓN DEL JUEGO',
            subtitle: 'Be greater. Be yourself.',
            text: `Experimenta el ascenso de Miles Morales y sé testigo de cómo el nuevo héroe domina nuevos poderes increíbles y explosivos para convertirse en su propia versión de Spider-Man.

En la última aventura del universo de Spider-Man de Marvel, el adolescente Miles Morales intenta ajustarse a su nuevo hogar mientras que sigue los pasos de su mentor, Peter Parker, para convertirse en el nuevo Spider-Man.

Pero cuando un feroz enfrentamiento por el poder amenaza con destruir su hogar, el aspirante a héroe entiende que un gran poder conlleva una gran responsabilidad. Para salvar a la Nueva York de Marvel, Miles debe adoptar el manto de Spider-Man y volverlo propio.`
        },
        features: [
            {
                title: 'El ascenso de Miles Morales',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/spiderman-miles-morales-screenshot-01-disclaimer-en-01oct20?$1600px--t$',
                text: 'Miles Morales descubre poderes explosivos que lo diferencian de su mentor, Peter Parker. Domina sus ataques bioeléctricos de ráfaga de veneno y su poder de camuflaje junto con espectaculares acrobacías de lanzamiento de telarañas, accesorios y habilidades.'
            },
            {
                title: 'Una guerra por el poder',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/spiderman-miles-morales-screenshot-04-disclaimer-en-01oct20?$1600px--t$',
                text: 'Una guerra por el control de la Nueva York de Marvel estalló entre una corporación de energía siniestra y un ejército criminal con tecnología de punta. Ahora que su hogar es el epicentro de la batalla, Miles debe aprender el costo de convertirse en héroe y decidir qué sacrificar por el bien mayor.'
            },
            {
                title: 'Un nuevo y vibrante hogar',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/spiderman-miles-morales-screenshot-03-disclaimer-en-01oct20?$1600px--t$',
                text: 'Recorre las ciudades nevadas del nuevo vecindario ajetreado y bullicioso mientras Miles busca un sentido de pertenencia. Cuando la línea entre su vida personal y la lucha contra el crimen se vuelve demasiado fina, descubrirá en quién puede confiar y qué se siente estar realmente en casa.'
            }
        ]
    },

    'god-of-war': {
        title: 'God of War Ragnarök',
        developer: 'Santa Monica Studio',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/99042a495af06f062902ade0eacd4064.png',
        coverImage: 'https://game-reviewer.com/wp-content/uploads/2022/10/1173124.jpg',
        video: '../videos/Ps/GodofWar.mp4',
        platforms: ['PS5', 'PS4'],
        releaseDate: '09/11/2022',
        trademark: 'God of War es una marca registrada de Sony Interactive Entertainment.',
        description: {
            title: 'EL FIN DE LOS TIEMPOS SE ACERCA',
            subtitle: 'Embárcate en un viaje épico',
            text: `Únete a Kratos y Atreus en un viaje profundamente emocional en el que se desatará el Ragnarök. Los dioses nórdicos están furiosos y solo un guerrero legendario puede detener el caos que se avecina.

Explora los majestuosos paisajes de los Nueve Reinos mientras Kratos enfrenta su pasado y Atreus descubre su verdadero destino. Juntos, padre e hijo deberán tomar decisiones que cambiarán el curso de la historia.

Enfréntate a dioses poderosos, criaturas mitológicas y descubre secretos ancestrales en esta épica conclusión de la saga nórdica de God of War.`
        },
        features: [
            {
                title: 'Combate visceral mejorado',
                image: 'https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png',
                text: 'Domina el hacha Leviatán y las espadas del Caos con un sistema de combate mejorado. Nuevas habilidades, combos devastadores y ataques especiales te esperan en cada batalla.'
            },
            {
                title: 'Mundo expansivo',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/god-of-war-ragnarok-watermark-screenshot-01-en-08sep21?$1600px$',
                text: 'Explora los Nueve Reinos con una libertad sin precedentes. Desde los fríos paisajes de Midgard hasta los desiertos ardientes de Muspelheim, cada reino ofrece desafíos únicos y secretos por descubrir.'
            },
            {
                title: 'Historia emocional',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/god-of-war-ragnarok-watermark-screenshot-08-en-08sep21?$1600px$',
                text: 'Vive una narrativa profunda sobre la paternidad, el legado y el sacrificio. Las decisiones de Kratos y Atreus moldearán su relación y el destino de los Nueve Reinos.'
            }
        ]
    },

    'the-last-of-us': {
        title: 'The Last of Us Part I',
        developer: 'Naughty Dog',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/1956768b78ac039215c9600c9691c572.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/ca6Dr3k7PXKaDgEbhN9eODeD.png',
        video: '../videos/Ps/TheLastofUsPartI.mp4',
        platforms: ['PS5'],
        releaseDate: '02/09/2022',
        trademark: 'The Last of Us es una marca registrada de Sony Interactive Entertainment.',
        description: {
            title: 'UNA AVENTURA QUE REDEFINIÓ UN GÉNERO',
            subtitle: 'Sobrevive en un mundo post-apocalíptico',
            text: `Revive la aclamada aventura que redefinió el género de survival horror. The Last of Us Part I presenta una remake completa con gráficos de última generación, gameplay mejorado y más.

Acompaña a Joel, un sobreviviente endurecido, y a Ellie, una joven valiente, en su peligroso viaje a través de un Estados Unidos post-apocalíptico. En un mundo devastado por una pandemia fungal, cada decisión cuenta y la confianza es un lujo que pocos pueden permitirse.

Experimenta una narrativa emocionalmente devastadora que ha sido elogiada por la crítica y jugadores por igual.`
        },
        features: [
            {
                title: 'Remake completo',
                image: 'https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/ca6Dr3k7PXKaDgEbhN9eODeD.png',
                text: 'Disfruta de gráficos completamente renovados con iluminación avanzada, efectos visuales mejorados y modelos de personajes de última generación que dan nueva vida a esta historia clásica.'
            },
            {
                title: 'Gameplay mejorado',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/the-last-of-us-part-i-pc-screenshot-01-en-09mar23?$1600px$',
                text: 'Controles más precisos, IA mejorada y mecánicas de juego actualizadas que aprovechan al máximo las capacidades de PS5, incluyendo feedback háptico y gatillos adaptativos.'
            },
            {
                title: 'Contenido adicional',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/the-last-of-us-part-i-pc-screenshot-06-en-09mar23?$1600px$',
                text: 'Incluye el aclamado modo Left Behind que explora los eventos que moldearon a Ellie, además de comentarios del desarrollo y modos de accesibilidad mejorados.'
            }
        ]
    },

    'astro-bot': {
        title: 'ASTRO BOT',
        developer: 'Team Asobi',
        price: 59.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/1ca2f82e3d208d4d56db7bcd9d6c20ce.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202406/0500/8f15268257b878597757fcc5f2c9545840867bc71fc863b1.png',
        video: '../videos/Ps/AstroBot.mp4',
        platforms: ['PS5'],
        releaseDate: '06/09/2024',
        trademark: 'ASTRO BOT es una marca registrada de Sony Interactive Entertainment.',
        description: {
            title: 'UNA NUEVA AVENTURA PLATAFORMERA',
            subtitle: 'Únete a Astro en su mayor aventura',
            text: `Prepárate para la aventura más grande de Astro hasta la fecha. En esta exclusiva de PS5, Astro debe rescatar a su tripulación dispersa por galaxias desconocidas.

Explora más de 80 niveles llenos de creatividad, desafíos únicos y sorpresas en cada esquina. Desde playas tropicales hasta ciudades futuristas, cada mundo ofrece experiencias únicas que aprovechan al máximo el control DualSense.

Con gráficos impresionantes en 4K y una jugabilidad refinada, ASTRO BOT establece un nuevo estándar para los juegos plataformeros.`
        },
        features: [
            {
                title: 'Mundos diversos',
                image: 'https://image.api.playstation.com/vulcan/ap/rnd/202406/0500/8f15268257b878597757fcc5f2c9545840867bc71fc863b1.png',
                text: 'Descubre más de 80 niveles repartidos en 6 galaxias diferentes, cada una con su propia temática, enemigos y mecánicas únicas que mantendrán la experiencia fresca.'
            },
            {
                title: 'Controles innovadores',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/Astro-Bot-key-features-image-block-03-en-17may24?$1600px--t$',
                text: 'Aprovecha al máximo el control DualSense con feedback háptico avanzado, gatillos adaptativos y el uso del giroscopio para una inmersión sin precedentes.'
            },
            {
                title: 'Habilidades especiales',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/astro-bot-wipeout-silhouette-image-block-01-en-22jul24?$1600px--t$',
                text: 'Desbloquea 15 habilidades nuevas incluyendo el Doggy Pack, Twin Frog Gloves y el Spiky Ball que añaden profundidad al gameplay y resolución de puzzles.'
            }
        ]
    },

    'helldivers-2': {
        title: 'HELLDIVERS™ 2',
        developer: 'Arrowhead Game Studios',
        price: 39.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/0abe10cc20cfedb109fd9cee834adc18.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202309/2117/3fe5f0891356f4c9988336e68bb9d2b6d29bed389e57cab4.png',
        video: '../videos/Ps/Helldivers2.mp4',
        platforms: ['PS5', 'PC'],
        releaseDate: '08/02/2024',
        trademark: 'HELLDIVERS es una marca registrada de Sony Interactive Entertainment.',
        description: {
            title: 'POR LA DEMOCRACIA Y LA LIBERTAD',
            subtitle: 'Únete a la lucha galáctica',
            text: `Conviértete en un Helldiver, un soldado de élite encargado de difundir la paz, la libertad y la democracia gestionada en toda la galaxia. En esta secuela en tercera persona, forma equipo con hasta tres amigos y libra intensas batallas contra enemigos alienígenas.

Usa una amplia variedad de armas, estrategias y equipo de apoyo para completar misiones en planetas hostiles. Cada decisión cuenta en esta experiencia cooperativa que redefine el shooter táctico.

¿Tienes lo que se necesita para servir a la Super Tierra y proteger a la humanidad de las amenazas extraterrestres?`
        },
        features: [
            {
                title: 'Cooperativo intenso',
                image: 'https://image.api.playstation.com/vulcan/ap/rnd/202309/2117/3fe5f0891356f4c9988336e68bb9d2b6d29bed389e57cab4.png',
                text: 'Juega con hasta 3 amigos en misiones cooperativas donde la comunicación y la estrategia son clave para la supervivencia. El fuego amigo está activado, ¡así que cuidado con tus compañeros!'
            },
            {
                title: 'Arsenal devastador',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/helldivers-2-screenshot-disclaimer-18-en-08sept23?$1600px$',
                text: 'Accede a más de 100 armas, estratagemas y equipos personalizables. Desde rifles de asalto hasta ataques orbitales, tienes todo lo necesario para difundir la democracia.'
            },
            {
                title: 'Guerra galáctica en vivo',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/helldivers-2-screenshot-08-en-08sept23?$1600px$',
                text: 'Participa en una campaña galáctica en constante evolución donde las acciones de la comunidad afectan el desarrollo de la guerra contra los Terminids y los Automatons.'
            }
        ]
    },

    'horizon-forbidden-west': {
        title: 'Horizon Forbidden West',
        developer: 'Guerrilla Games',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/0a31b8b048c10332ece27bef9670bda8.png',
        coverImage: 'https://blizzstoreperu.com/cdn/shop/products/1dy5w3SNiJnXjP8YvmydCL9X_png.jpg?v=1644610548',
        video: '../videos/Xbox/Horizoncorto.mp4',
        platforms: ['PS5', 'PS4'],
        releaseDate: '18/02/2022',
        trademark: 'Horizon es una marca registrada de Sony Interactive Entertainment.',
        description: {
            title: 'EXPLORA EL OESTE PROHIBIDO',
            subtitle: 'Únete a Aloy en su viaje épico',
            text: `Embárcate en un viaje impresionante a través del Oeste Prohibido, una frontera majestuosa pero peligrosa que oculta nuevas amenazas misteriosas. Únete a Aloy mientras se aventura en el futuro desconocido, luchando contra máquinas enormes y enfrentándose a nuevas tribus.

Explora paisajes impresionantes, desde bosques frondosos hasta ciudades sumergidas, en un mundo abierto vasto y lleno de vida. Descubre secretos ancestrales y desentraña la verdad detrás de la misteriosa plaga que amenaza con destruir todo lo que queda.

Con gráficos de última generación y un sistema de combate mejorado, Horizon Forbidden West lleva la aventura a nuevos horizontes.`
        },
        features: [
            {
                title: 'Mundo abierto expansivo',
                image: 'https://blizzstoreperu.com/cdn/shop/products/1dy5w3SNiJnXjP8YvmydCL9X_png.jpg?v=1644610548',
                text: 'Explora un vasto mundo abierto que incluye bosques, desiertos, montañas y ruinas submarinas, cada área con su propia ecología, desafíos y secretos por descubrir.'
            },
            {
                title: 'Combate estratégico mejorado',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/horizon-forbidden-west-screenshot-05-disclaimer-02oct20?$1600px$',
                text: 'Domina nuevas armas y habilidades, incluyendo el Shieldwing para planear, el Pullcaster para escalar rápidamente y herramientas para enfrentarte a máquinas más grandes y peligrosas.'
            },
            {
                title: 'Historia profunda',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/horizon-forbidden-west-screenshot-01-disclaimer-02oct20?$1600px$',
                text: 'Sumérgete en una narrativa emocionante que expande el lore del mundo de Horizon, presentando nuevos personajes memorables y revelando verdades impactantes sobre el pasado del planeta.'
            }
        ]
    },

    'gta-v': {
        title: 'Grand Theft Auto V',
        developer: 'Rockstar Games',
        price: 39.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/0828cc07186513dc0c320b2894fd000b.png',
        coverImage: 'https://upload.wikimedia.org/wikipedia/ru/thumb/c/c8/GTAV_Official_Cover_Art.jpg/330px-GTAV_Official_Cover_Art.jpg',
        video: '../videos/Ps/GtaV.mp4',
        platforms: ['PS5', 'PS4'],
        releaseDate: '17/09/2013',
        trademark: 'Grand Theft Auto es una marca registrada de Take-Two Interactive.',
        description: {
            title: 'EL FENÓMENO MUNDIAL',
            subtitle: 'Vive la vida criminal definitiva',
            text: `Experimenta el juego de mundo abierto que redefinió una generación. Grand Theft Auto V te lleva a Los Santos, una metrópolis vasta y soleada llena de gurús de la autoayuda, estrellas de cine en decadencia y celebridades de la televisión.

Cuando un joven estafador callejero, un ladrón de bancos retirado y un terror psicópata se ven involucrados con algunos de los elementos más aterradores y trastornados del mundo criminal, el gobierno de los EE. UU. y la industria del entretenimiento, deben llevar a cabo una serie de peligrosos golpes para sobrevivir.

Con versiones mejoradas para PS5 que incluyen mejoras gráficas, rendimiento acelerado y mucho más.`
        },
        features: [
            {
                title: 'Tres protagonistas',
                image: 'https://upload.wikimedia.org/wikipedia/ru/thumb/c/c8/GTAV_Official_Cover_Art.jpg/330px-GTAV_Official_Cover_Art.jpg',
                text: 'Cambia entre Michael, Franklin y Trevor en cualquier momento, experimentando la historia desde tres perspectivas únicas mientras planean y ejecutan golpes épicos.'
            },
            {
                title: 'Mundo vivo y reactivo',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/grand-theft-auto-v-screen-01-ps4-en-22jul20?$1600px$',
                text: 'Explora Los Santos y el condado de Blaine County, un mundo masivo y detallado lleno de actividades, misiones secundarias y secretos por descubrir.'
            },
            {
                title: 'GTA Online',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/grand-theft-auto-v-screen-02-ps4-en-22jul20?$1600px$',
                text: 'Únete a millones de jugadores en el dinámico mundo de GTA Online, con actualizaciones constantes que añaden nuevos modos, vehículos, propiedades y experiencias.'
            }
        ]
    },

    'pes-2021': {
        title: 'eFootball PES 2021',
        developer: 'Konami',
        price: 29.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/4da4211ada13c42bb74d67bd017f9c26.png',
        coverImage: 'https://vulcan.dl.playstation.net/img/rnd/202011/0201/DCT1LwEUb8fXfS2PZfkzXV59.png',
        video: '../videos/PS/PES2021.mp4',
        platforms: ['PS4'],
        releaseDate: '15/09/2020',
        trademark: 'eFootball PES es una marca registrada de Konami Digital Entertainment.',
        description: {
            title: 'LA ESENCIA DEL FÚTBOL',
            subtitle: 'Vive el deporte rey como nunca antes',
            text: `eFootball PES 2021 Season Update representa la cumbre de la simulación futbolística, ofreciendo el gameplay más realista y satisfactorio de la serie. Con licencias exclusivas, gráficos mejorados y mecánicas de juego refinadas.

Disfruta de modos de juego mejorados incluyendo mi EQUIPO, Liga Master y Partido Rápido, con todos los equipos, jugadores y estadios actualizados para la temporada 2020-2021.

Con el motor Fox Engine mejorado, experimenta animaciones más fluidas, IA más inteligente y un realismo sin precedentes que te hará sentir en el campo de juego.`
        },
        features: [
            {
                title: 'Gameplay realista',
                image: 'https://image.api.playstation.com/vulcan/img/rnd/202008/2500/oXNMCC9zubNx5voDQvSKbF2x.jpg',
                text: 'Sistema de control mejorado que ofrece un equilibrio perfecto entre accesibilidad y profundidad, con mecánicas de tiro, pase y regate completamente renovadas.'
            },
            {
                title: 'Licencias exclusivas',
                image: 'https://igabiba.com/cdn/shop/products/efootball-pes-2021-season-update-ps4-4012927105184-29501211050163_800x.jpg?v=1628810826',
                text: 'Disfruta de asociaciones exclusivas con clubes como FC Barcelona, Manchester United, Bayern de Múnich y Juventus, con escaneos faciales reales de jugadores.'
            },
            {
                title: 'Modos de juego completos',
                image: 'https://cdn.hobbyconsolas.com/sites/navi.axelspringer.es/public/media/image/2020/09/efootball-pes-2021-1200-2068623.jpg?tf=3840x',
                text: 'Desde el modo competitivo mi EQUIPO hasta la profundidad de la Liga Master, encuentra tu forma preferida de disfrutar del fútbol con contenido para todos los gustos.'
            }
        ]
    },

    'ratchet-clank': {
        title: 'Ratchet & Clank: Rift Apart',
        developer: 'Insomniac Games',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/2551fff47df5a2ada83f8c1cb4e530b8.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202101/2921/QYQ3S7LubGFoVfn8vJ3cmZHw.png',
        video: '../videos/Ps/RatchetClankRiftApart.mp4',
        platforms: ['PS5'],
        releaseDate: '11/06/2021',
        trademark: 'Ratchet & Clank es una marca registrada de Sony Interactive Entertainment.',
        description: {
            title: 'SALTA ENTRE DIMENSIONES',
            subtitle: 'La aventura interdimensional definitiva',
            text: `Únete a los héroes intergalácticos Ratchet y Clank mientras atraviesan dimensiones para enfrentarse a un emperador maligno de otra realidad. Salta instantáneamente entre mundos llenos de acción y descubre un arsenal alucinante junto a compañeros nuevos y antiguos.

Experimenta el poder de la SSD de PS5 con transiciones instantáneas entre mundos increíblemente detallados. Explora planetas llenos de vida y descubre las capacidades del control DualSense con feedback háptico y gatillos adaptativos.

Con gráficos que aprovechan el ray tracing y hasta 60 FPS, esta es la experiencia Ratchet & Clank más inmersiva hasta la fecha.`
        },
        features: [
            {
                title: 'Viaje interdimensional',
                image: 'https://image.api.playstation.com/vulcan/ap/rnd/202101/2921/QYQ3S7LubGFoVfn8vJ3cmZHw.png',
                text: 'Salta instantáneamente entre dimensiones con la tecnología SSD de PS5, explorando mundos completamente diferentes sin tiempos de carga.'
            },
            {
                title: 'Arsenal creativo',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/ratchet-and-clank-rift-apart-screenshot-01-ps5-en-15jun20?$1600px$',
                text: 'Domina más de 20 armas dimensionales incluyendo el Burst Pistol, Topiary Sprinkler y el Shatterbomb, cada una con efectos visuales y táctiles únicos.'
            },
            {
                title: 'Nuevos personajes',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/ratchet-and-clank-rift-apart-screenshot-02-ps5-en-15jun20?$1600px$',
                text: 'Juega como Rivet, una Lombax misteriosa de otra dimensión que se une a la lucha contra el malvado Emperor Nefarious.'
            }
        ]
    },

    'call-of-duty': {
        title: 'Call of Duty: Black Ops 6',
        developer: 'Treyarch',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/d1138551e9d69e06ac09c0f71a37cbf1.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202405/2921/4b45cf4b319a65e05f6e4f87a22c7b91d2e7e8aeb247b61f.png',
        video: '../videos/CallofDutycorto.mp4',
        platforms: ['PS5', 'PS4'],
        releaseDate: '25/10/2024',
        trademark: 'Call of Duty es una marca registrada de Activision.',
        description: {
            title: 'ENTRÉGATE A LA LOCURA',
            subtitle: 'Vive la experiencia más alucinante de Black Ops',
            text: `Adéntrate en los turbulentos inicios de los años 90, una época de transición y desconfianza. Black Ops 6 ofrece una campaña cinematográfica, un Multijugador innovador y un Zombies aterrador.

La campaña te lleva por todo el mundo en una narrativa de espionaje de alto riesgo, donde las líneas entre aliados y enemigos se desdibujan. En Multijujador, experimenta el combate más dinámico hasta la fecha con nuevos movimientos, armas y mapas diseñados para la acción constante.

Con el regreso del modo Zombies clásico y nuevas experiencias cooperativas, Black Ops 6 ofrece el paquete más completo de la franquicia.`
        },
        features: [
            {
                title: 'Campaña cinematográfica',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/call-of-duty-black-ops-6-screenshot-dynamic-campaign-en-13jun24?$1600px$',
                text: 'Embárcate en una campaña global que abarca desde operaciones encubiertas hasta conflictos a gran escala, con decisiones que afectan el desarrollo de la historia.'
            },
            {
                title: 'Multijugador revolucionario',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/call-of-duty-black-ops-6-screenshot-omnimovement-en-13jun24?$1600px$',
                text: 'Nuevo sistema de movimiento Omni-Movement, 12 mapas disponibles al lanzamiento y el regreso de Prestigios clásicos junto a nuevas progresiones.'
            },
            {
                title: 'Zombies clásico y nuevo',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/call-of-duty-black-ops-6-screenshot-zombies-en-13jun24?$1600px$',
                text: 'Dos experiencias Zombies al lanzamiento: Round-Based clásico y una nueva experiencia de mundo abierto con misiones y objetivos dinámicos.'
            }
        ]
    },

    'final-fantasy': {
        title: 'Final Fantasy XVI',
        developer: 'Square Enix',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/36e4dbaad3926d14f1c7a7ebcdc4b811.png',
        coverImage: 'https://upload.wikimedia.org/wikipedia/en/0/00/Final_Fantasy_XVI_cover_art.png',
        video: '../videos/Ps/FinalFantasyXVI.mp4',
        platforms: ['PS5'],
        releaseDate: '22/06/2023',
        trademark: 'Final Fantasy es una marca registrada de Square Enix.',
        description: {
            title: 'LA GUERRA DE LOS EIKONS',
            subtitle: 'Forja tu destino',
            text: `Sumérgete en el mundo de Valisthea, una tierra bendecida por los Cristales Madre y donde existen seres poderosos conocidos como Eikons. Sigue la historia de Clive Rosfield, primer descendiente del archiduque de Rosaria, en su búsqueda de venganza.

Experimenta un sistema de combate completamente nuevo y dinámico que combina elementos de acción y RPG, creado por el equipo detrás de la serie Devil May Cry. Enfréntate a batallas épicas contra Eikons que cambiarán el curso de la historia.

Con una narrativa madura y cinematográfica, Final Fantasy XVI representa una nueva era para la legendaria franquicia.`
        },
        features: [
            {
                title: 'Combate acción-RPG',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/final-fantasy-xvi-screenshot-02-en-31may23?$1600px$',
                text: 'Sistema de combate en tiempo real que combina ataques cuerpo a cuerpo, magia y habilidades de Eikon, con la posibilidad de cambiar entre diferentes estilos de combate.'
            },
            {
                title: 'Historia épica',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/final-fantasy-xvi-screenshot-11-en-01dec22?$1600px$',
                text: 'Narrativa madura que explora temas de poder, libertad y destino a través de una campaña de más de 40 horas con cinemáticas de calidad cinematográfica.'
            },
            {
                title: 'Mundo de Valisthea',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/final-fantasy-xvi-screenshot-03-en-31may23?$1600px$',
                text: 'Explora seis reinos únicos, cada uno con su propia cultura, política y relación con los Cristales Madre que otorgan magia a la humanidad.'
            }
        ]
    },

    'resident-evil': {
        title: 'Resident Evil 4',
        developer: 'Capcom',
        price: 59.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/5b658d2a925565f0755e035597f8d22f.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202210/0706/EVWyZD63pahuh95eKloFaJuC.png',
        video: '../videos/Ps/RE4.mp4',
        platforms: ['PS5', 'PS4'],
        releaseDate: '24/03/2023',
        trademark: 'Resident Evil es una marca registrada de Capcom.',
        description: {
            title: 'SOBREVIVE AL TERROR',
            subtitle: 'El clásico reimaginado',
            text: `Revive el viaje de pesadilla de Leon S. Kennedy en un remake completo que preserva la esencia del juego original mientras introduce gameplay moderno, una historia reimaginada y gráficos espectaculares.

Seis años después de los eventos de Raccoon City, el agente Leon Kennedy es enviado a una remota aldea europea para rescatar a la hija del presidente, quien ha sido secuestrada. Lo que descubre es una comunidad aterrorizada por un culto misterioso.

Con controles modernizados, gráficos de última generación y contenido adicional, Resident Evil 4 ofrece la experiencia definitiva de survival horror.`
        },
        features: [
            {
                title: 'Gameplay modernizado',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/resident-evil-4-remake-leon-screen-01-en-15nov22?$1600px$',
                text: 'Sistema de combate renovado que mantiene la esencia del original mientras incorpora mecánicas modernas como movimiento mientras apuntas y cuchillo parry.'
            },
            {
                title: 'Grficos de última generación',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/resident-evil-4-remake-screen-10-ps5-en-01nov22?$1600px$',
                text: 'Ambientes completamente reconstruidos con iluminación realista, efectos visuales mejorados y modelos de personajes de alta fidelidad que dan nueva vida al mundo.'
            },
            {
                title: 'Contenido adicional',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/resident-evil-4-remake-screen-12-ps5-en-01nov22?$1600px$',
                text: 'Incluye el modo Mercenarios y nuevas armas exclusivas, además de mejoras en la narrativa que expanden la historia de personajes secundarios.'
            }
        ]
    },

    // Agrega estos juegos a tu gamesDatabase en juegos/game-detail.js

'bloodborne': {
    title: 'Bloodborne',
    developer: 'FromSoftware',
    price: 19.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/bloodborne-video.mp4',
    platforms: ['PS4'],
    releaseDate: '24/03/2015',
    trademark: 'Bloodborne es una marca registrada de Sony Interactive Entertainment.',
    description: {
        title: 'CAZA O SER CAZADO',
        subtitle: 'Enfréntate a tus pesadillas',
        text: `Sumérgete en la ciudad gótica de Yharnam, un lugar plagado de una enfermedad endémica que ha transformado a sus habitantes en bestias aterradoras. Como un cazador, deberás navegar por calles traicioneras y luchar contra criaturas de pesadilla para descubrir la fuente de esta plaga.

Bloodborne ofrece un combate rápido y estratégico que recompensa la agresividad y la precisión. Con un mundo interconectado lleno de secretos, jefes épicos y una narrativa profunda, este juego de FromSoftware estableció un nuevo estándar en el género de acción RPG.`
    },
    features: [
        {
            title: 'Combate rápido y brutal',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Sistema de combate que premia la agresividad con el mecanismo de recuperación de vida y armas transformables que ofrecen gran variedad de movimientos.'
        },
        {
            title: 'Mundo gótico interconectado',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Explora Yharnam y sus alrededores, un mundo oscuro y retorcido donde cada camino conduce a nuevos descubrimientos y peligros mortales.'
        },
        {
            title: 'Jefes épicos',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Enfréntate a más de 20 jefes únicos, cada uno con patrones de ataque distintivos y lore profundo que expande la historia del mundo.'
        }
    ]
},

'persona-5': {
    title: 'Persona 5 Royal',
    developer: 'Atlus',
    price: 59.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/persona5-video.mp4',
    platforms: ['PS4'],
    releaseDate: '31/03/2020',
    trademark: 'Persona es una marca registrada de Atlus.',
    description: {
        title: 'VIVE LA VIDA DE UN LADRÓN FANTASMA',
        subtitle: 'Cambia los corazones corruptos',
        text: `Forja relaciones, desentraña misterios y lucha por la justicia como el líder de los Ladrones Fantasma. Persona 5 Royal expande el aclamado RPG con nuevo contenido, personajes y mecánicas de juego.

Durante el día, vive como un estudiante de intercambio en Tokio, forjando amistades y mejorando tus habilidades. Por la noche, infíltrate en los Palacios Metaverso de adultos corruptos para cambiar sus corazones y hacerles enfrentar sus crímenes.`
    },
    features: [
        {
            title: 'Jugabilidad mejorada',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Nuevos personajes, Palacios, eventos y mecánicas como el gancho de garfio y los Confidantes adicionales que expanden la experiencia.'
        },
        {
            title: 'Combate por turnos estratégico',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Sistema de combate que recompensa la explotación de debilidades enemigas y el uso táctico de tus Personas y habilidades del grupo.'
        },
        {
            title: 'Simulación social',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Gestiona tu tiempo entre actividades escolares, trabajos a tiempo parcial y relaciones sociales que afectan tus habilidades en batalla.'
        }
    ]
},

'uncharted-4': {
    title: 'Uncharted 4: A Thief\'s End',
    developer: 'Naughty Dog',
    price: 19.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/08aee6276db142f4b8ac98fb8ee0ed1b.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/2000/B3Xbu6aW10scvc4SE7yXA1lZ.png',
    video: '../videos/Ps/Uncharted4.mp4',
    platforms: ['PS4'],
    releaseDate: '10/05/2016',
    trademark: 'Uncharted es una marca registrada de Sony Interactive Entertainment.',
    description: {
        title: 'EL VIAJE DEFINITIVO',
        subtitle: 'Varias vidas por delante, un pasado por detrás',
        text: `Nathan Drake sale del retiro para rescatar a su hermano mayor, Sam, y se embarca en un viaje por el mundo para descubrir el tesoro pirata más grande de la historia. Desde las calles de Italia hasta las junglas de Madagascar.

Uncharted 4: A Thief's End lleva a los jugadores alrededor del globo a través de la perspectiva de Nathan Drake en su aventura más grande y personal hasta la fecha, probando sus límites físicos, su resolución y lo que está dispuesto a sacrificar para salvar a los que ama.`
    },
    features: [
        {
            title: 'Aventura cinematográfica',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/2000/B3Xbu6aW10scvc4SE7yXA1lZ.png',
            text: 'Narrativa emocionalmente cargada que cierra la historia de Nathan Drake con secuencias de acción espectaculares y momentos íntimos.'
        },
        {
            title: 'Mundo abierto más grande',
            image: 'https://gmedia.playstation.com/is/image/SIEPDC/uncharted-4-screenshot-15-15jun15?$1600px$',
            text: 'Niveles más expansivos que permiten múltiples enfoques y exploración, incluyendo el uso del gancho y el jeep para navegar el terreno.'
        },
        {
            title: 'Multijugador mejorado',
            image: 'https://gmedia.playstation.com/is/image/SIEPDC/uncharted-4-screenshot-14-15jun15?$1600px$',
            text: 'Modo multijugador con nuevos personajes, mapas, modos de juego y el sistema Místicas que otorga poderes sobrenaturales.'
        }
    ]
},

'red-dead-2': {
    title: 'Red Dead Redemption 2',
    developer: 'Rockstar Games',
    price: 39.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/ff38348a5adb1889dd55c7ccba583c43.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/Ps/rdd2.mp4',
    platforms: ['PS4'],
    releaseDate: '26/10/2018',
    trademark: 'Red Dead Redemption es una marca registrada de Take-Two Interactive.',
    description: {
        title: 'AMÉRICA, 1899',
        subtitle: 'El fin del Salvaje Oeste ha comenzado',
        text: `America, 1899. El Salvaje Oeste se está acabando. Cuando las fuerzas de la ley cazan a la última banda de forajidos, Arthur Morgan y la pandilla Van der Linde se ven forzados a huir. Con agentes federales y los mejores cazarrecompensas de la nación pisándoles los talones, la pandilla deberá robarlos, lucharlos y abrirse camino a través de la América despiadada para sobrevivir.

Red Dead Redemption 2 es una épica historia de honor y lealtad en el ocaso del Salvaje Oeste, del creador de Grand Theft Auto V y Red Dead Redemption.`
    },
    features: [
        {
            title: 'Mundo abierto masivo',
            image: 'https://cdn2.steamgriddb.com/hero_thumb/4d57c8ac8153e8565a307084434a7355.jpg',
            text: 'Explora cinco estados únicos desde las montañas nevadas hasta los pantanos, cada uno con su propia fauna, clima y habitantes.'
        },
        {
            title: 'Narrativa profunda',
            image: 'https://gmedia.playstation.com/is/image/SIEPDC/red-dead-redemption-2-screen-13-ps4-eu-09may18?$1600px$',
            text: 'Historia épica de más de 60 horas que sigue el declive de la banda Van der Linde y la transformación personal de Arthur Morgan.'
        },
        {
            title: 'Sistema de honor',
            image: 'https://gmedia.playstation.com/is/image/SIEPDC/red-dead-redemption-2-screen-10-ps4-eu-09may18?$1600px$',
            text: 'Tus decisiones afectan cómo el mundo reacciona a ti, desde diálogos hasta misiones disponibles y el final de la historia.'
        }
    ]
},

'ghost-of-tsushima': {
    title: 'Ghost of Tsushima',
    developer: 'Sucker Punch Productions',
    price: 59.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/ghost-video.mp4',
    platforms: ['PS4'],
    releaseDate: '17/07/2020',
    trademark: 'Ghost of Tsushima es una marca registrada de Sony Interactive Entertainment.',
    description: {
        title: 'CONVIÉRTETE EN EL FANTASMA',
        subtitle: 'Forja un nuevo camino',
        text: `En el año 1274, los temibles mongoles han invadido la isla de Tsushima, arrasando con las fuerzas samurái locales. Como uno de los últimos supervivientes de un clan samurái, Jin Sakai debe dominar un nuevo estilo de lucha, el camino del Fantasma, para desafiar a los mongoles y luchar por la libertad de Tsushima y su gente.

Ghost of Tsushima es una aventura de mundo abierto que te lleva a la época del Japón feudal, donde el honor y la tradición chocan con la necesidad de supervivencia.`
    },
    features: [
        {
            title: 'Combate samurái',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Sistema de combate que incluye duelos de katana al estilo samurái y el sigiloso estilo Fantasma con herramientas y tácticas no convencionales.'
        },
        {
            title: 'Mundo inspirado en Japón',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Explora la isla de Tsushima, desde campos de bambú y santuarios antiguos hasta pueblos devastados por la guerra, todo inspirado en el Japón feudal.'
        },
        {
            title: 'Modo foto y cine',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Captura la belleza de Tsushima con un modo foto avanzado y experimenta el juego en japonés con el modo Cine que imita las películas clásicas.'
        }
    ]
},

'death-stranding': {
    title: 'Death Stranding',
    developer: 'Kojima Productions',
    price: 39.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/deathstranding-video.mp4',
    platforms: ['PS4'],
    releaseDate: '08/11/2019',
    trademark: 'Death Stranding es una marca registrada de Sony Interactive Entertainment.',
    description: {
        title: 'CONECTA UN MUNDO FRAGMENTADO',
        subtitle: 'Un juego de Hideo Kojima',
        text: `En un futuro cercano, misteriosas explosiones han sacudido el planeta, desencadenando una serie de eventos sobrenaturales conocidos como el Death Stranding. Con espectros fantasmales que plaguen el paisaje, y el planeta al borde de la aniquilación, Sam Porter Bridges debe viajar a través de un paisaje devastado para salvar a la humanidad de la inminente extinción.

Death Stranding es una experiencia única que desafía los géneros tradicionales, ofreciendo una reflexión sobre la conexión en un mundo desconectado.`
    },
    features: [
        {
            title: 'Gameplay único',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Sistema de juego centrado en la entrega de paquetes y la superación de terrenos desafiantes con planificación estratégica y gestión de equipo.'
        },
        {
            title: 'Mundo asincrónico',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Conecta con otros jugadores indirectamente a través de estructuras compartidas, mensajes y recursos que ayudan en tu viaje.'
        },
        {
            title: 'Reparto estelar',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Protagonizada por Norman Reedus, con Mads Mikkelsen, Léa Seydoux y Lindsay Wagner, dirigida por el legendario Hideo Kojima.'
        }
    ]
},

'sekiro': {
    title: 'Sekiro: Shadows Die Twice',
    developer: 'FromSoftware',
    price: 59.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/sekiro-video.mp4',
    platforms: ['PS4'],
    releaseDate: '22/03/2019',
    trademark: 'Sekiro es una marca registrada de Activision.',
    description: {
        title: 'RECUPERA TU HONOR',
        subtitle: 'Muere y revive para vengarte',
        text: `En el Japón de la era Sengoku a finales de 1500, un shinobi de un brazo debe rescatar a su maestro y vengarse de su archienemigo. Como el "lobo de un brazo", utilizarás herramientas prostéticas mortales y habilidades ninjas letales mientras combates en un mundo brutal de finales del siglo XVI en Japón.

Sekiro: Shadows Die Twice presenta un combate intenso cara a cara, exploración vertical y un sistema de resurrección único que te permite volver de la muerte para continuar la lucha.`
    },
    features: [
        {
            title: 'Combate de espadas preciso',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Sistema de combate basado en la postura que recompensa la deflexión precisa y el rompimiento de la postura del enemigo para ejecutar muertes instantáneas.'
        },
        {
            title: 'Movilidad ninja',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Gancho de garfio que permite movimiento vertical, sigilo desde arriba y posicionamiento táctico durante el combate.'
        },
        {
            title: 'Herramientas prostéticas',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Arsenal de herramientas ninja que incluyen lanzallamas, paraguas escudo, y hachas que rompen defensas, cada una con múltiples mejoras.'
        }
    ]
},

'final-fantasy-7-remake': {
    title: 'Final Fantasy VII Remake',
    developer: 'Square Enix',
    price: 69.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/ff7remake-video.mp4',
    platforms: ['PS4'],
    releaseDate: '10/04/2020',
    trademark: 'Final Fantasy es una marca registrada de Square Enix.',
    description: {
        title: 'EL CLÁSICO RENACIDO',
        subtitle: 'La leyenda continúa',
        text: `Final Fantasy VII Remake es una reimaginación del clásico de 1997 que expande la historia original mientras mantiene su esencia. Sigue a Cloud Strife, un ex-soldado que se une a un grupo de eco-terroristas para luchar contra la corporación Shinra que está drenando la vida del planeta.

La historia se expande más allá de Midgar con nuevos personajes, escenas y mecánicas de juego que ofrecen una experiencia fresca tanto para nuevos jugadores como para fans del original.`
    },
    features: [
        {
            title: 'Combate híbrido',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Sistema de combate que combina acción en tiempo real con pausa táctical, permitiendo el uso de habilidades, magia y objetos estratégicamente.'
        },
        {
            title: 'Historia expandida',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Nuevos eventos, personajes y desarrollos que profundizan en el mundo de Final Fantasy VII mientras mantiene los momentos icónicos del original.'
        },
        {
            title: 'Mundo detallado',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Midgar cobra vida con un nivel de detalle sin precedentes, desde los barrios bajos hasta los plateados niveles superiores de la ciudad.'
        }
    ]
},

'marvel-spider-man': {
    title: 'Marvel\'s Spider-Man',
    developer: 'Insomniac Games',
    price: 39.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/49ac4dcbd03f3f39085f257edefb5d0d.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202008/1021/TcGI9MAo2YqLqO8U6cUeOXVU.png',
    video: '../videos/spiderman-ps4-video.mp4',
    platforms: ['PS4'],
    releaseDate: '07/09/2018',
    trademark: 'Spider-Man es una marca registrada de Marvel Entertainment, LLC.',
    description: {
        title: 'SE MAYOR',
        subtitle: 'Ponte la máscara',
        text: `Marvel's Spider-Man presenta a un Peter Parker experimentado que ha estado luchando contra el crimen en Nueva York durante ocho años. Domina el combate y el movimiento acrobático, utiliza elementos y habilidades del traje, y vive las presiones de la vida de Peter Parker en esta emocionante aventura de acción en mundo abierto.

Cuando el Sr. Negativo surge con una nueva amenaza, Spider-Man y Peter Parker se ven envueltos en una batalla que pondrá a prueba sus límites y los obligará a elegir entre sus responsabilidades personales y salvar a la ciudad.`
    },
    features: [
        {
            title: 'Movimiento acrobático',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202008/1021/TcGI9MAo2YqLqO8U6cUeOXVU.png',
            text: 'Sistema de balanceo que te permite navegar por Nueva York de manera fluida y espectacular, con transiciones perfectas entre movimiento y combate.'
        },
        {
            title: 'Combate fluido',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202008/1021/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Combina ataques cuerpo a cuerpo, esquivasy elementos del traje para crear combos devastadores contra múltiples enemigos simultáneamente.'
        },
        {
            title: 'Nueva York viva',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202008/1021/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Explora una Nueva York detallada llena de actividades, coleccionables y misiones secundarias que expanden el lore del universo Spider-Man.'
        }
    ]
},

'days-gone': {
    title: 'Days Gone',
    developer: 'Bend Studio',
    price: 29.99,
    logo: 'https://cdn2.steamgriddb.com/logo_thumb/5fcfd8c1c650b5d7eec0a6a4a6b4a6a4.png',
    coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
    video: '../videos/daysgone-video.mp4',
    platforms: ['PS4'],
    releaseDate: '26/04/2019',
    trademark: 'Days Gone es una marca registrada de Sony Interactive Entertainment.',
    description: {
        title: 'SOBREVIVE EN UN MUNDO ROTO',
        subtitle: 'Enfréntate a la manada',
        text: `Days Gone es un juego de acción-aventura en mundo abierto ambientado en un paisaje salvaje y hostil dos años después de una pandemia global que ha matado a casi todos, pero transformado a millones en Criaturas, zombies voraces que se mueven en manadas masivas.

Juega como Deacon St. John, un cazarecompensas que enfrenta las dificultades de un mundo brutal mientras busca una razón para vivir en este emocionante viaje de pérdida, venganza y esperanza.`
    },
    features: [
        {
            title: 'Manadas dinámicas',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/7Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Enfréntate a manadas de cientos de Criaturas que se comportan de manera realista, cazando en grupo y respondiendo a tu presencia y tácticas.'
        },
        {
            title: 'Moto personalizable',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/8Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Tu motocicleta es tu principal medio de transporte y puede ser mejorada con diferentes partes que afectan su rendimiento y capacidades.'
        },
        {
            title: 'Mundo abierto hostil',
            image: 'https://image.api.playstation.com/vulcan/ap/rnd/202009/2806/9Qh8kXwU8Y9Y9Y9Y9Y9Y9Y9Y.png',
            text: 'Explora un mundo cambiante afectado por el clima, el ciclo día/noche y los comportamientos dinámicos de enemigos humanos y no humanos.'
        }
    ]
},

    'nba-2k25': {
        title: 'NBA 2K25',
        developer: 'Visual Concepts',
        price: 69.99,
        logo: 'https://cdn2.steamgriddb.com/logo_thumb/5a844ce8c6a016e575494ba877c69db1.png',
        coverImage: 'https://image.api.playstation.com/vulcan/ap/rnd/202406/0521/47126dbd889a804f04e5b80ea35973622b041c060c9e1249.jpg',
        video: '../videos/Ps/nba.mp4',
        platforms: ['PS5', 'PS4'],
        releaseDate: '06/09/2024',
        trademark: 'NBA 2K es una marca registrada de 2K Sports.',
        description: {
            title: 'EL JUEGO DE BALONCESTO DEFINITIVO',
            subtitle: 'Vive la emoción de la NBA',
            text: `Experimenta el baloncesto más auténtico con NBA 2K25, que presenta gameplay mejorado, gráficos de última generación y modos de juego profundos. Con la tecnología ProPLAY, captura movimientos reales de jugadores de la NBA para una experiencia sin precedentes.

Crea tu propio legenda en Mi CARRERA, construye el equipo de tus sueños en Mi EQUIPO, o toma el control de tu franquicia favorita en Mi GM. Con mejoras en la IA, animaciones y física del juego, esta es la simulación de baloncesto más realista hasta la fecha.

Con licencias completas de la NBA y la WNBA, juega con tus equipos y jugadores favoritos en arenas fielmente recreadas.`
        },
        features: [
            {
                title: 'Tecnología ProPLAY',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/nba-2k25-screenshot-03-en-03july24?$1600px$',
                text: 'Sistema de animación revolucionario que utiliza filmaciones reales de jugadores de la NBA para crear movimientos más auténticos y fluidos que nunca.'
            },
            {
                title: 'Mi CARRERA mejorado',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/nba-2k25-screenshot-04-en-03july24?$1600px$',
                text: 'Nueva narrativa cinematográfica, sistema de progresión renovado y ciudad en línea expandida con más actividades y formas de personalizar a tu jugador.'
            },
            {
                title: 'Baloncesto auténtico',
                image: 'https://gmedia.playstation.com/is/image/SIEPDC/nba-2k25-screenshot-02-en-03july24?$1600px$',
                text: 'IA mejorada, física del juego más realista y mecánicas de defensa y ataque refinadas que recompensan el juego estratégico y la habilidad.'
            }
        ]
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Función principal de inicialización
function initializeApp() {
    checkAuth();
    updateCartDisplay();
    initializeEventListeners();
}

// ========================================
// SISTEMA DE CARGA DE JUEGOS
// ========================================

function loadGameData(gameId) {
    const game = gamesDatabase[gameId];
    if (!game) {
        // Juego no encontrado, redirigir
        showNotification('Juego no encontrado', 'error');
        setTimeout(() => {
            window.location.href = '../ps5.html';
        }, 2000);
        return;
    }

    currentGameData = game;

    // Actualizar título de página
    document.title = `${game.title} - PlayStation Store`;

    // Sección Hero
    document.getElementById('game-title').textContent = game.title;
    document.getElementById('game-developer').textContent = game.developer;
    document.getElementById('game-logo').src = game.logo;
    document.getElementById('game-logo').alt = game.title;
    document.getElementById('game-price').textContent = `US$${game.price}`;
    
    // Video
    const videoSource = document.getElementById('video-source');
    videoSource.src = game.video;
    const heroVideo = document.getElementById('hero-video');
    heroVideo.load();
    
    // Si el video falla, mostrar imagen de respaldo
    heroVideo.addEventListener('error', function() {
        console.log('Error cargando video, usando imagen de respaldo');
        this.style.backgroundImage = `url('${game.features[0].image}')`;
        this.style.backgroundSize = 'cover';
        this.style.backgroundPosition = 'center';
        this.innerHTML = '';
    });

    // Plataformas
    const platformsContainer = document.getElementById('platforms');
    platformsContainer.innerHTML = game.platforms.map(platform => 
        `<span class="platform-tag">${platform}</span>`
    ).join('');

    // Información de lanzamiento
    document.getElementById('release-info').innerHTML = `
        <p>Disponible desde ${game.releaseDate}</p>
        <p>Versión digital incluida sin costo adicional con la de PS4™.*</p>
        <p>Ayuda de juego admitido</p>
    `;

    // Rating de contenido (genérico, puedes personalizar por juego)
    document.getElementById('content-rating').innerHTML = `
        <div class="rating-tags">
            <span class="rating-tag">Lenguaje</span>
            <span class="rating-tag">Violencia intensa</span>
            <span class="rating-tag">Sangre</span>
        </div>
        <p class="in-game-purchase">Compras dentro del juego</p>
    `;

    // Descripción
    document.getElementById('description-title').textContent = game.description.title;
    document.getElementById('description-subtitle').textContent = game.description.subtitle;
    document.getElementById('description-text').innerHTML = game.description.text
        .split('\n\n')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
    
    // Fondo de descripción
    document.getElementById('description-bg').style.backgroundImage = `url('${game.features[0].image}')`;

    // Características
    document.getElementById('features-title').textContent = 'Características principales';
    const featuresGrid = document.getElementById('features-grid');
    featuresGrid.innerHTML = game.features.map((feature, index) => `
        <div class="feature-card">
            <div class="feature-image">
                <img src="${feature.image}" alt="${feature.title}" loading="lazy">
            </div>
            <div class="feature-content">
                <h3>${feature.title}</h3>
                <p>${feature.text}</p>
            </div>
        </div>
    `).join('');

    // Trademark en footer
    document.getElementById('game-trademark').textContent = game.trademark;
}

// ========================================
// SISTEMA DE AUTENTICACIÓN
// ========================================

function checkAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            isLoggedIn = true;
            updateLoginButton();
            loadCartFromFirestore();
        } else {
            currentUser = null;
            isLoggedIn = false;
            updateLoginButton();
            cart = [];
            updateCartDisplay();
        }
    });
}

function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (isLoggedIn && currentUser) {
        db.collection('users').doc(currentUser.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userName = doc.data().name;
                    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Hola, ${userName.split(' ')[0]}`;
                } else {
                    loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Mi Cuenta`;
                }
            })
            .catch(() => {
                loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> Mi Cuenta`;
            });
    } else {
        loginBtn.innerHTML = 'Iniciar sesión';
        loginBtn.onclick = redirectToAuth;
    }
}

function redirectToAuth() {
    if (isLoggedIn) {
        showNotification('Ya estás autenticado', 'info');
    } else {
        window.location.href = '../auth.html?redirect=juegos/game-detail.html?id=' + getCurrentGameId();
    }
}

function getCurrentGameId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'spider-man-2';
}

// ========================================
// SISTEMA DE CARRITO
// ========================================

function saveCartToFirestore() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).update({
        cart: cart,
        cartUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).catch((error) => {
        console.error('Error guardando carrito:', error);
    });
}

function loadCartFromFirestore() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().cart) {
                cart = doc.data().cart;
                updateCartDisplay();
                displayCartItems();
            }
        })
        .catch((error) => {
            console.error('Error cargando carrito:', error);
        });
}

function addToCart() {
    if (!currentGameData) return;
    
    const gameId = getCurrentGameId();
    const game = currentGameData;
    
    if (!isLoggedIn) {
        showNotification('Debes iniciar sesión para añadir productos al carrito', 'warning');
        setTimeout(() => {
            window.location.href = '../auth.html';
        }, 1500);
        return;
    }
    
    const existingItem = cart.find(item => item.id === gameId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: gameId,
            name: game.title,
            price: game.price,
            image: game.coverImage || game.logo, // ← USA coverImage PRIMERO, si no existe usa logo
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveCartToFirestore();
    showNotification(`${game.title} añadido al carrito`, 'success');
}

function removeFromCart(gameId) {
    cart = cart.filter(item => item.id !== gameId);
    updateCartDisplay();
    displayCartItems();
    saveCartToFirestore();
}

function updateCartQuantity(gameId, change) {
    const item = cart.find(item => item.id === gameId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(gameId);
        } else {
            updateCartDisplay();
            displayCartItems();
            saveCartToFirestore();
        }
    }
}

function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
        checkoutBtn.onclick = proceedToCheckout;
    }
}

function displayCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        cartTotalElement.textContent = '0.00';
        return;
    }
    
    let cartHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
                <div class="cart-item-info" style="flex: 1; margin-left: 15px;">
                    <h4 style="margin-bottom: 5px;">${item.name}</h4>
                    <p style="color: #0070f3; font-weight: bold;">$${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-controls" style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="updateCartQuantity('${item.id}', -1)" style="width: 30px; height: 30px; border: none; background: #333; color: white; border-radius: 3px; cursor: pointer;">-</button>
                    <span style="min-width: 20px; text-align: center;">${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', 1)" style="width: 30px; height: 30px; border: none; background: #333; color: white; border-radius: 3px; cursor: pointer;">+</button>
                    <button onclick="removeFromCart('${item.id}')" style="margin-left: 10px; padding: 5px 10px; background: #d32f2f; color: white; border: none; border-radius: 3px; cursor: pointer;">Eliminar</button>
                </div>
            </div>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #333;">
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    cartTotalElement.textContent = total.toFixed(2);
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.onclick = proceedToCheckout;
    }
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('El carrito está vacío', 'warning');
        return;
    }
    
    localStorage.setItem('guestCart', JSON.stringify(cart));
    localStorage.setItem('checkoutOrigin', 'juegos/game-detail.html?id=' + getCurrentGameId());
    
    if (isLoggedIn && currentUser) {
        saveCartToFirestore();
    }
    
    window.location.href = '../checkout.html';
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    
    if (modal.style.display === 'block') {
        displayCartItems();
    }
}

// ========================================
// NOTIFICACIONES Y EVENT LISTENERS
// ========================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

function initializeEventListeners() {
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('cartModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Efecto parallax en sección de descripción
    window.addEventListener('scroll', function() {
        const descriptionSection = document.querySelector('.description-section');
        if (descriptionSection) {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            const bg = document.getElementById('description-bg');
            if (bg) {
                bg.style.backgroundPosition = `center ${rate}px`;
            }
        }
    });

    // Atajos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('cartModal');
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        }
    });
}

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .cart-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
    }
    
    .notification {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);