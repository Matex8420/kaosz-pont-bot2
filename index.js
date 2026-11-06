require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Bot beállítása a szükséges Intent-ekkel
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Adattárolás memóriában
const kaoszPontok = new Map();

// Slash parancsok definiálása magyarul
const commands = [
    new SlashCommandBuilder()
        .setName('kaoszpont')
        .setDescription('Megmutatja a jelenlegi Káosz Pontjaidat.'),
    
    new SlashCommandBuilder()
        .setName('kaosz-adas')
        .setDescription('Káosz Pontot ad egy felhasználónak.')
        .addUserOption(option => 
            option.setName('felhasznalo')
                .setDescription('A felhasználó, aki a pontot kapja')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('pont')
                .setDescription('A hozzáadandó pontok száma')
                .setRequired(true)),
                
    new SlashCommandBuilder()
        .setName('kaosz-toplista')
        .setDescription('Megmutatja a legtöbb Káosz Ponttal rendelkező tagokat.'),
        
    new SlashCommandBuilder()
        .setName('kaosz-dobj')
        .setDescription('Dobj a Káosz Kockával (1-100 pont közötti véletlenszerű nyeremény vagy veszteség)!')
].map(command => command.toJSON());

// Bot készenléti állapota
client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} sikeresen elindult!`);
    
    // Slash parancsok regisztrálása globálisan
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Parancsok frissítése...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Parancsok sikeresen regisztrálva!');
    } catch (error) {
        console.error('Hiba a parancsok regisztrálásakor:', error);
    }
});

// Parancsok kezelése
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user, guild } = interaction;

    // /kaoszpont
    if (commandName === 'kaoszpont') {
        const pont = kaoszPontok.get(user.id) || 0;
        const embed = new EmbedBuilder()
            .setColor(0x990000)
            .setTitle('🌀 Káosz Pont Egyenleg')
            .setDescription(`Kedves **${user.username}**, jelenleg **${pont}** Káosz Pontod van!`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // /kaosz-adas
    if (commandName === 'kaosz-adas') {
        const celPontozott = interaction.options.getUser('felhasznalo');
        const hozzaadando = interaction.options.getInteger('pont');

        const jelenlegi = kaoszPontok.get(celPontozott.id) || 0;
        const ujErtek = jelenlegi + hozzaadando;
        kaoszPontok.set(celPontozott.id, ujErtek);

        const embed = new EmbedBuilder()
            .setColor(0xFF5733)
            .setTitle('💥 Káosz Pont Osztás')
            .setDescription(`**${user.username}** adott **${hozzaadando}** Káosz Pontot neki: ${celPontozott}!`)
            .addFields({ name: 'Új egyenleg:', value: `${ujErtek} pont` });

        await interaction.reply({ embeds: [embed] });
    }

    // /kaosz-toplista
    if (commandName === 'kaosz-toplista') {
        const rendezett = Array.from(kaoszPontok.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        let leiras = rendezett.length === 0 ? 'Még senkinek sincs Káosz Pontja!' : '';
        
        for (let i = 0; i < rendezett.length; i++) {
            const [id, pont] = rendezett[i];
            leiras += `**${i + 1}.** <@${id}> — **${pont}** pont\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFC300)
            .setTitle('🏆 Káosz Pont Toplista')
            .setDescription(leiras)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }

    // /kaosz-dobj
    if (commandName === 'kaosz-dobj') {
        const valtozas = Math.floor(Math.random() * 101) - 30; // -30 és +70 között
        const jelenlegi = kaoszPontok.get(user.id) || 0;
        const ujErtek = Math.max(0, jelenlegi + valtozas);
        kaoszPontok.set(user.id, ujErtek);

        const üzenet = valtozas >= 0 
            ? `Szerencséd volt! Nyertél **${valtozas}** Káosz Pontot!`
            : `A káosz elnyelt tőled **${Math.abs(valtozas)}** Káosz Pontot!`;

        const embed = new EmbedBuilder()
            .setColor(valtozas >= 0 ? 0x2ECC71 : 0xE74C3C)
            .setTitle('🎲 Káosz Kocka Dobás')
            .setDescription(üzenet)
            .addFields({ name: 'Jelenlegi pontjaid:', value: `${ujErtek} pont` });

        await interaction.reply({ embeds: [embed] });
    }
});

// Bejelentkezés a bot fiókba
client.login(process.env.DISCORD_TOKEN);
