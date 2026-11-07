const fs = require('fs');

const suppPath = 'data/sources/scope_a_supplement.json';
const supplement = JSON.parse(fs.readFileSync(suppPath, 'utf-8'));

// High quality translations for all 85 concepts in the required languages
const translations85 = {
  // Vocabulary / words
  c_kebab: {
    nl: { text: 'kebab', article: 'de' },
    de: { text: 'Kebab', article: 'der' },
    fr: { text: 'kebab', article: 'le' },
    es: { text: 'kebab', article: 'el' },
    it: { text: 'kebab', article: 'il' },
    pt: { text: 'kebab', article: 'o' }
  },
  c_wolf: {
    nl: { text: 'wolf', article: 'de' },
    de: { text: 'Wolf', article: 'der' }
  },
  c_giraffe: {
    nl: { text: 'giraf', article: 'de' },
    de: { text: 'Giraffe', article: 'die' }
  },
  c_pasta_alfredo: {
    nl: { text: 'pasta alfredo' },
    de: { text: 'Pasta Alfredo' },
    es: { text: 'pasta alfredo' }
  },
  c_orange: {
    de: { text: 'Orange', article: 'die' },
    fr: { text: 'orange', article: "l'" }
  },
  c_tiger: {
    de: { text: 'Tiger', article: 'der' }
  },
  c_leopard: {
    de: { text: 'Leopard', article: 'der' }
  },
  c_pilot: {
    de: { text: 'Pilot', article: 'der' }
  },
  c_basketball: {
    de: { text: 'Basketball', article: 'der' },
    fr: { text: 'basket-ball', article: 'le' }
  },
  c_volleyball: {
    de: { text: 'Volleyball', article: 'der' },
    fr: { text: 'volley-ball', article: 'le' }
  },
  c_animation: {
    de: { text: 'Animation', article: 'die' },
    fr: { text: 'animation', article: "l'" }
  },
  c_lion: {
    fr: { text: 'lion', article: 'le' }
  },
  c_crocodile: {
    fr: { text: 'crocodile', article: 'le' }
  },
  c_chef: {
    fr: { text: 'chef cuisinier', article: 'le' },
    it: { text: 'capocuoco', article: 'il' }
  },
  c_police: {
    fr: { text: 'police', article: 'la' }
  },
  c_yogurt: {
    it: { text: 'yogurt', article: 'lo' }
  },
  c_hot_dog: {
    it: { text: 'hot dog', article: "l'" }
  },
  c_mountain_bike: {
    it: { text: 'mountain bike', article: 'la' }
  },

  // 47 Collocations
  c_i_need_to_make_a_decision_about_my_career: {
    nl: { text: 'Ik moet een beslissing nemen over mijn carrière.' },
    de: { text: 'Ich muss eine Entscheidung über meine Karriere treffen.' },
    fr: { text: 'Je dois prendre une décision concernant ma carrière.' },
    es: { text: 'Tengo que tomar una decisión sobre mi carrera.' },
    it: { text: 'Devo prendere una decisione sulla mia carriera.' },
    pt: { text: 'Preciso de tomar uma decisão sobre a minha carreira.' },
    tr: { text: 'Kariyerim hakkında bir karar vermem gerekiyor.' },
    pl: { text: 'Muszę podjąć decyzję dotyczącą mojej kariery.' }
  },
  c_its_time_to_take_responsibility_for_your_actions: {
    nl: { text: 'Het is tijd om verantwoordelijkheid te nemen voor je daden.' },
    de: { text: 'Es ist Zeit, Verantwortung für deine Handlungen zu übernehmen.' },
    fr: { text: 'Il est temps d’assumer la responsabilité de vos actes.' },
    es: { text: 'Es hora de asumir la responsabilidad de tus acciones.' },
    it: { text: 'È tempo di assumersi la responsabilità delle proprie azioni.' },
    pt: { text: 'Está na hora de assumir a responsabilidade pelos seus atos.' },
    tr: { text: 'Eylemlerinin sorumluluğunu alma zamanı geldi.' },
    pl: { text: 'Czas wziąć odpowiedzialność za swoje czyny.' }
  },
  c_i_use_an_app_to_keep_track_of_my_expenses: {
    nl: { text: 'Ik gebruik een app om mijn uitgaven bij te houden.' },
    de: { text: 'Ich verwende eine App, um meine Ausgaben im Blick zu behalten.' },
    fr: { text: 'J’utilise une application pour suivre mes dépenses.' },
    es: { text: 'Uso una aplicación para llevar el control de mis gastos.' },
    it: { text: 'Uso un’app per tenere traccia delle mie spese.' },
    pt: { text: 'Utilizo uma aplicação para controlar as minhas despesas.' },
    tr: { text: 'Harcamalarımı takip etmek için bir uygulama kullanıyorum.' },
    pl: { text: 'Używam aplikacji do śledzenia moich wydatków.' }
  },
  c_i_fell_behind_in_my_studies_after_being_sick: {
    nl: { text: 'Ik liep achterstand op met mijn studie na ziek te zijn geweest.' },
    de: { text: 'Nachdem ich krank war, bin ich mit dem Lernen in Rückstand geraten.' },
    fr: { text: 'J’ai pris du retard dans mes études après avoir été malade.' },
    es: { text: 'Me quedé atrás en mis estudios después de estar enfermo.' },
    it: { text: 'Sono rimasto indietro con gli studi dopo essere stato malato.' },
    pt: { text: 'Fiquei para trás nos estudos depois de ter ficado doente.' },
    tr: { text: 'Hastalandıktan sonra derslerimde geri kaldım.' },
    pl: { text: 'Po chorobie narobiłem sobie zaległości w nauce.' }
  },
  c_we_ended_up_staying_at_home_because_of_rain: {
    nl: { text: 'Uiteindelijk zijn we thuisgebleven vanwege de regen.' },
    de: { text: 'Wegen des Regens sind wir letztendlich zu Hause geblieben.' },
    fr: { text: 'Nous avons fini par rester à la maison à cause de la pluie.' },
    es: { text: 'Terminamos quedándonos en casa debido a la lluvia.' },
    it: { text: 'Alla fine siamo rimasti a casa per via della pioggia.' },
    pt: { text: 'Acabámos por ficar em casa por causa da chuva.' },
    tr: { text: 'Yağmur yüzünden sonunda evde kaldık.' },
    pl: { text: 'W końcu zostaliśmy w domu z powodu deszczu.' }
  },
  c_everything_worked_out_well_in_the_end: {
    nl: { text: 'Uiteindelijk is alles goed gekomen.' },
    de: { text: 'Am Ende hat sich alles zum Guten gewendet.' },
    fr: { text: 'Tout s’est bien terminé à la fin.' },
    es: { text: 'Al final todo salió bien.' },
    it: { text: 'Alla fine tutto è andato per il meglio.' },
    pt: { text: 'Tudo correu bem no final.' },
    tr: { text: 'Sonunda her şey yoluna girdi.' },
    pl: { text: 'Ostatecznie wszystko dobrze się ułożyło.' }
  },
  c_im_getting_used_to_waking_up_early: {
    nl: { text: 'Ik begin te wennen aan vroeg opstaan.' },
    de: { text: 'Ich gewöhne mich langsam daran, früh aufzustehen.' },
    fr: { text: 'Je m’habitue à me lever tôt.' },
    es: { text: 'Me estoy acostumbrando a levantarme temprano.' },
    it: { text: 'Mi sto abituando a svegliarmi presto.' },
    pt: { text: 'Estou a habituar-me a acordar cedo.' },
    tr: { text: 'Erken kalkmaya alışıyorum.' },
    pl: { text: 'Przyzwyczajam się do wczesnego wstawania.' }
  },
  c_i_tend_to_overthink_things_before_bed: {
    nl: { text: 'Ik heb de neiging om voor het slapengaan te veel na te denken.' },
    de: { text: 'Ich neige dazu, vor dem Schlafen zu viel nachzudenken.' },
    fr: { text: 'J’ai tendance à trop réfléchir avant de dormir.' },
    es: { text: 'Tiendo a pensar demasiado antes de acostarme.' },
    it: { text: 'Tendo a rimuginare troppo prima di dormire.' },
    pt: { text: 'Tendo a pensar demasiado antes de ir para a cama.' },
    tr: { text: 'Yatmadan önce her şeyi fazla düşünme eğilimindeyim.' },
    pl: { text: 'Przed snem mam tendencję do zbytniego rozmyślania.' }
  },
  c_i_managed_to_finish_the_project_on_time: {
    nl: { text: 'Het is me gelukt om het project op tijd af te ronden.' },
    de: { text: 'Ich habe es geschafft, das Projekt pünktlich abzuschließen.' },
    fr: { text: 'J’ai réussi à terminer le projet à temps.' },
    es: { text: 'Logré terminar el proyecto a tiempo.' },
    it: { text: 'Sono riuscito a finire il progetto in tempo.' },
    pt: { text: 'Consegui terminar o projecto a tempo.' },
    tr: { text: 'Projeyi zamanında bitirmeyi başardım.' },
    pl: { text: 'Udało mi się ukończyć projekt na czas.' }
  },
  c_everyone_makes_mistakes_sometimes: {
    nl: { text: 'Iedereen maakt wel eens een fout.' },
    de: { text: 'Jeder macht mal Fehler.' },
    fr: { text: 'Tout le monde fait des erreurs parfois.' },
    es: { text: 'Todo el mundo comete errores a veces.' },
    it: { text: 'Tutti commettono errori a volte.' },
    pt: { text: 'Toda a gente comete erros às vezes.' },
    tr: { text: 'Herkes bazen hata yapar.' },
    pl: { text: 'Każdy czasami popełnia błędy.' }
  },
  c_i_usually_have_breakfast_at_8_am: {
    nl: { text: 'Ik ontbijt meestal om 8 uur ’s ochtends.' },
    de: { text: 'Normalerweise frühstücke ich um 8 Uhr morgens.' },
    fr: { text: 'D’habitude, je prends mon petit-déjeuner à 8 heures.' },
    es: { text: 'Normalmente desayuno a las 8 de la mañana.' },
    it: { text: 'Di solito faccio colazione alle 8 del mattino.' },
    pt: { text: 'Costumo tomar o pequeno-almoço às 8h.' },
    tr: { text: 'Genellikle sabah saat 8’de kahvaltı yaparım.' },
    pl: { text: 'Zazwyczaj jem śniadanie o 8 rano.' }
  },
  c_lets_take_a_break_for_15_minutes: {
    nl: { text: 'Laten we 15 minuten pauzeren.' },
    de: { text: 'Lass uns eine Viertelstunde Pause machen.' },
    fr: { text: 'Faisons une pause de 15 minutes.' },
    es: { text: 'Tomemos un descanso de 15 minutos.' },
    it: { text: 'Facciamo una pausa di 15 minuti.' },
    pt: { text: 'Vamos fazer uma pausa de 15 minutos.' },
    tr: { text: '15 dakika ara verelim.' },
    pl: { text: 'Zróbmy 15 minut przerwy.' }
  },
  c_you_need_to_pay_attention_in_class: {
    nl: { text: 'Je moet opletten in de les.' },
    de: { text: 'Du musst im Unterricht aufpassen.' },
    fr: { text: 'Tu dois être attentif en classe.' },
    es: { text: 'Tienes que prestar atención en clase.' },
    it: { text: 'Devi fare attenzione in classe.' },
    pt: { text: 'Tens de prestar atenção na aula.' },
    tr: { text: 'Derste dikkatini vermelisin.' },
    pl: { text: 'Musisz uważać na lekcji.' }
  },
  c_i_caught_a_cold_last_week: {
    nl: { text: 'Ik heb vorige week een kou gevat.' },
    de: { text: 'Ich habe mich letzte Woche erkältet.' },
    fr: { text: 'J’ai attrapé un rhume la semaine dernière.' },
    es: { text: 'Me resfrié la semana pasada.' },
    it: { text: 'Ho preso un raffreddore la scorsa settimana.' },
    pt: { text: 'Apanhei uma constipação na semana passada.' },
    tr: { text: 'Geçen hafta soğuk aldım.' },
    pl: { text: 'Przeziębiłem się w zeszłym tygodniu.' }
  },
  c_im_trying_to_save_money_for_a_trip: {
    nl: { text: 'Ik probeer geld te sparen voor een reis.' },
    de: { text: 'Ich versuche, Geld für eine Reise zu sparen.' },
    fr: { text: 'J’essaie d’économiser pour un voyage.' },
    es: { text: 'Estoy intentando ahorrar dinero para un viaje.' },
    it: { text: 'Sto cercando di risparmiare per un viaggio.' },
    pt: { text: 'Estou a poupar dinheiro para uma viagem.' },
    tr: { text: 'Bir gezi için para biriktirmeye çalışıyorum.' },
    pl: { text: 'Próbuję zaoszczędzić pieniądze na wyjazd.' }
  },
  c_we_need_to_collect_user_feedback_through_surveys: {
    nl: { text: 'We moeten gebruikersfeedback verzamelen via enquêtes.' },
    de: { text: 'Wir müssen Nutzerfeedback durch Umfragen erfassen.' },
    fr: { text: 'Nous devons recueillir les retours des utilisateurs via des sondages.' },
    es: { text: 'Necesitamos recopilar comentarios de usuarios mediante encuestas.' },
    it: { text: 'Dobbiamo raccogliere i feedback degli utenti tramite sondaggi.' },
    pt: { text: 'Precisamos de recolher feedback dos utilizadores através de inquéritos.' },
    tr: { text: 'Anketler yoluyla kullanıcı geri bildirimi toplamamız gerekiyor.' },
    pl: { text: 'Musimy zebrać opinie użytkowników za pomocą ankiet.' }
  },
  c_our_goal_is_to_beat_competitors_in_q4: {
    nl: { text: 'Ons doel is om de concurrenten in het vierde kwartaal te verslaan.' },
    de: { text: 'Unser Ziel ist es, die Konkurrenz im vierten Quartal zu schlagen.' },
    fr: { text: 'Notre objectif est de dépasser nos concurrents au quatrième trimestre.' },
    es: { text: 'Nuestro objetivo es superar a la competencia en el cuarto trimestre.' },
    it: { text: 'Il nostro obiettivo è superare i concorrenti nel quarto trimestre.' },
    pt: { text: 'O nosso objetivo é superar os concorrentes no quarto trimestre.' },
    tr: { text: 'Hedefimiz dördüncü çeyrekte rakipleri geçmektir.' },
    pl: { text: 'Naszym celem jest pokonanie konkurencji w czwartym kwartale.' }
  },
  c_a_developer_raised_a_concern_about_the_timeline: {
    nl: { text: 'Een ontwikkelaar uitte een zorg over de planning.' },
    de: { text: 'Ein Entwickler äußerte Bedenken bezüglich des Zeitplans.' },
    fr: { text: 'Un développeur a exprimé une inquiétude concernant le calendrier.' },
    es: { text: 'Un desarrollador expresó preocupación por los plazos.' },
    it: { text: 'Uno sviluppatore ha sollevato un dubbio sulla tempistica.' },
    pt: { text: 'Um desenvolvedor levantou uma preocupação sobre o calendário.' },
    tr: { text: 'Bir geliştirici takvimle ilgili bir endişe dile getirdi.' },
    pl: { text: 'Jeden z programistów wyraził obawy dotyczące harmonogramu.' }
  },
  c_lets_move_forward_with_the_proposed_solution: {
    nl: { text: 'Laten we verdergaan met de voorgestelde oplossing.' },
    de: { text: 'Lassen Sie uns mit der vorgeschlagenen Lösung fortfahren.' },
    fr: { text: 'Avançons avec la solution proposée.' },
    es: { text: 'Avancemos con la solución propuesta.' },
    it: { text: 'Andiamo avanti con la soluzione proposta.' },
    pt: { text: 'Vamos avançar com a solução proposta.' },
    tr: { text: 'Önerilen çözümle yola devam edelim.' },
    pl: { text: 'Przejdźmy dalej z proponowanym rozwiązaniem.' }
  },
  c_the_project_is_on_the_right_track: {
    nl: { text: 'Het project ligt op het goede spoor.' },
    de: { text: 'Das Projekt ist auf dem richtigen Weg.' },
    fr: { text: 'Le projet est sur la bonne voie.' },
    es: { text: 'El proyecto va por buen camino.' },
    it: { text: 'Il progetto è sulla buona strada.' },
    pt: { text: 'O projecto está no bom caminho.' },
    tr: { text: 'Proje doğru yolda ilerliyor.' },
    pl: { text: 'Projekt jest na dobrej drodze.' }
  },
  c_the_team_is_making_steady_progress: {
    nl: { text: 'Het team boekt gestage vooruitgang.' },
    de: { text: 'Das Team macht stetige Fortschritte.' },
    fr: { text: 'L’équipe progresse régulièrement.' },
    es: { text: 'El equipo está progresando de manera constante.' },
    it: { text: 'Il team sta facendo progressi costanti.' },
    pt: { text: 'A equipa está a fazer progressos constantes.' },
    tr: { text: 'Ekip istikrarlı bir ilerleme kaydediyor.' },
    pl: { text: 'Zespół robi stabilne postępy.' }
  },
  c_ux_plays_a_key_role_in_product_success: {
    nl: { text: 'UX speelt een sleutelrol in het succes van het product.' },
    de: { text: 'Die Benutzererfahrung spielt eine Schlüsselrolle für den Produkterfolg.' },
    fr: { text: 'L’expérience utilisateur joue un rôle clé dans le succès du produit.' },
    es: { text: 'La experiencia de usuario juega un papel fundamental en el éxito del producto.' },
    it: { text: 'La UX gioca un ruolo fondamentale nel successo del prodotto.' },
    pt: { text: 'A UX desempenha um papel fulcral no sucesso do produto.' },
    tr: { text: 'Kullanıcı deneyimi, ürünün başarısında kilit bir rol oynar.' },
    pl: { text: 'UX odgrywa kluczową rolę w sukcesie produktu.' }
  },
  c_we_must_take_action_to_resolve_this_issue: {
    nl: { text: 'We moeten actie ondernemen om dit probleem op te lossen.' },
    de: { text: 'Wir müssen handeln, um dieses Problem zu beheben.' },
    fr: { text: 'Nous devons agir pour résoudre ce problème.' },
    es: { text: 'Debemos tomar medidas para resolver este problema.' },
    it: { text: 'Dobbiamo agire per risolvere questo problema.' },
    pt: { text: 'Temos de agir para resolver este problema.' },
    tr: { text: 'Bu sorunu çözmek için harekete geçmeliyiz.' },
    pl: { text: 'Musimy podjąć działania, aby rozwiązać ten problem.' }
  },
  c_scrum_focuses_on_continuous_improvement: {
    nl: { text: 'Scrum richt zich op continue verbetering.' },
    de: { text: 'Scrum konzentriert sich auf kontinuierliche Verbesserung.' },
    fr: { text: 'Scrum met l’accent sur l’amélioration continue.' },
    es: { text: 'Scrum se centra en la mejora continua.' },
    it: { text: 'Scrum punta al miglioramento continuo.' },
    pt: { text: 'O Scrum foca-se na melhoria contínua.' },
    tr: { text: 'Scrum sürekli iyileştirmeye odaklanır.' },
    pl: { text: 'Scrum kładzie nacisk na ciągłe doskonalenie.' }
  },
  c_the_release_was_delayed_due_to_technical_issues: {
    nl: { text: 'De release liep vertraging op door technische problemen.' },
    de: { text: 'Die Veröffentlichung hat sich aufgrund technischer Probleme verzögert.' },
    fr: { text: 'Le lancement a été retardé en raison de problèmes techniques.' },
    es: { text: 'El lanzamiento se retrasó debido a problemas técnicos.' },
    it: { text: 'Il rilascio è stato ritardato a causa di problemi tecnici.' },
    pt: { text: 'O lançamento foi adiado devido a problemas técnicos.' },
    tr: { text: 'Sürüm teknik sorunlar nedeniyle gecikti.' },
    pl: { text: 'Wydanie opóźniło się z powodów technicznych.' }
  },
  c_the_team_always_meets_deadlines: {
    nl: { text: 'Het team haalt altijd de deadlines.' },
    de: { text: 'Das Team hält Fristen immer pünktlich ein.' },
    fr: { text: 'L’équipe respecte toujours les délais.' },
    es: { text: 'El equipo siempre cumple con los plazos de entrega.' },
    it: { text: 'Il team rispetta sempre le scadenze.' },
    pt: { text: 'A equipa cumpre sempre os prazos.' },
    tr: { text: 'Ekip teslim tarihlerini her zaman yakalar.' },
    pl: { text: 'Zespół zawsze dotrzymuje terminów.' }
  },
  c_we_need_to_set_clear_priorities_for_next_sprint: {
    nl: { text: 'We moeten duidelijke prioriteiten stellen voor de volgende sprint.' },
    de: { text: 'Wir müssen klare Prioritäten für den nächsten Sprint setzen.' },
    fr: { text: 'Nous devons définir des priorités claires pour le prochain sprint.' },
    es: { text: 'Debemos establecer prioridades claras para el próximo sprint.' },
    it: { text: 'Dobbiamo fissare priorità chiare per il prossimo sprint.' },
    pt: { text: 'Temos de definir prioridades claras para o próximo sprint.' },
    tr: { text: 'Gelecek sprint için net öncelikler belirlemeliyiz.' },
    pl: { text: 'Musimy ustalić jasne priorytety na kolejny sprint.' }
  },
  c_lets_address_this_issue_immediately: {
    nl: { text: 'Laten we deze kwestie onmiddellijk aanpakken.' },
    de: { text: 'Lassen Sie uns dieses Problem sofort angehen.' },
    fr: { text: 'Traitons ce problème immédiatement.' },
    es: { text: 'Abordemos este problema de inmediato.' },
    it: { text: 'Affrontiamo questo problema immediatamente.' },
    pt: { text: 'Vamos resolver este problema imediatamente.' },
    tr: { text: 'Bu konuyu hemen ele alalım.' },
    pl: { text: 'Zajmijmy się tą sprawą natychmiast.' }
  },
  c_were_planning_to_launch_the_product_in_june: {
    nl: { text: 'We zijn van plan het product in juni te lanceren.' },
    de: { text: 'Wir planen, das Produkt im Juni auf den Markt zu bringen.' },
    fr: { text: 'Nous prévoyons de lancer le produit en juin.' },
    es: { text: 'Planeamos lanzar el producto en junio.' },
    it: { text: 'Stiamo pianificando di lanciare il prodotto a giugno.' },
    pt: { text: 'Estamos a planear lançar o produto em junho.' },
    tr: { text: 'Ürünü haziran ayında piyasaya sürmeyi planlıyoruz.' },
    pl: { text: 'Planujemy wprowadzić produkt na rynek w czerwcu.' }
  },
  c_we_use_analytics_to_track_performance: {
    nl: { text: 'We gebruiken analyses om de prestaties te volgen.' },
    de: { text: 'Wir nutzen Analysen, um die Leistung zu messen.' },
    fr: { text: 'Nous utilisons des analyses pour suivre la performance.' },
    es: { text: 'Usamos análisis de datos para seguir el rendimiento.' },
    it: { text: 'Usiamo le analisi per monitorare le prestazioni.' },
    pt: { text: 'Usamos análises para acompanhar o desempenho.' },
    tr: { text: 'Performansı izlemek için analizleri kullanıyoruz.' },
    pl: { text: 'Używamy analiz do śledzenia wydajności.' }
  },
  c_a_scrum_team_consists_of_three_roles: {
    nl: { text: 'Een Scrumteam bestaat uit drie rollen.' },
    de: { text: 'Ein Scrum-Team besteht aus drei Rollen.' },
    fr: { text: 'Une équipe Scrum se compose de trois rôles.' },
    es: { text: 'Un equipo Scrum consta de tres roles.' },
    it: { text: 'Un team Scrum è composto da tre ruoli.' },
    pt: { text: 'Uma equipa de Scrum é composta por três funções.' },
    tr: { text: 'Bir Scrum takımı üç rolden oluşur.' },
    pl: { text: 'Zespół Scrum składa się z trzech ról.' }
  },
  c_the_dashboard_provides_access_to_realtime_metrics: {
    nl: { text: 'Het dashboard biedt toegang tot realtime statistieken.' },
    de: { text: 'Das Dashboard bietet Zugriff auf Echtzeit-Kennzahlen.' },
    fr: { text: 'Le tableau de bord donne accès à des métriques en temps réel.' },
    es: { text: 'El panel proporciona acceso a métricas en tiempo real.' },
    it: { text: 'La dashboard fornisce l’accesso a metriche in tempo reale.' },
    pt: { text: 'O painel fornece acesso a métricas em tempo real.' },
    tr: { text: 'Gösterge paneli gerçek zamanlı metriklere erişim sağlar.' },
    pl: { text: 'Pulpit nawigacyjny zapewnia dostęp do wskaźników w czasie rzeczywistym.' }
  },
  c_success_depends_on_teamwork: {
    nl: { text: 'Succes hangt af van teamwerk.' },
    de: { text: 'Erfolg hängt von Teamarbeit ab.' },
    fr: { text: 'La réussite dépend du travail d’équipe.' },
    es: { text: 'El éxito depende del trabajo en equipo.' },
    it: { text: 'Il successo dipende dal lavoro di squadra.' },
    pt: { text: 'O sucesso depende do trabalho de equipa.' },
    tr: { text: 'Başarı takım çalışmasına bağlıdır.' },
    pl: { text: 'Sukces zależy od pracy zespołowej.' }
  },
  c_i_believe_in_our_product_vision: {
    nl: { text: 'Ik geloof in onze productvisie.' },
    de: { text: 'Ich glaube an unsere Produktvision.' },
    fr: { text: 'Je crois en la vision de notre produit.' },
    es: { text: 'Creo en la visión de nuestro producto.' },
    it: { text: 'Credo nella visione del nostro prodotto.' },
    pt: { text: 'Acredito na visão do nosso produto.' },
    tr: { text: 'Ürün vizyonumuza inanıyorum.' },
    pl: { text: 'Wierzę w wizję naszego produktu.' }
  },
  c_lets_focus_on_the_main_priorities: {
    nl: { text: 'Laten we ons concentreren op de hoofdprioriteiten.' },
    de: { text: 'Konzentrieren wir uns auf die wichtigsten Prioritäten.' },
    fr: { text: 'Concentrons-nous sur les priorités principales.' },
    es: { text: 'Centrémonos en las prioridades principales.' },
    it: { text: 'Concentriamoci sulle priorità principali.' },
    pt: { text: 'Vamos concentrar-nos nas principais prioridades.' },
    tr: { text: 'Ana önceliklere odaklanalım.' },
    pl: { text: 'Skupmy się na głównych priorytetach.' }
  },
  c_we_succeeded_in_launching_on_time: {
    nl: { text: 'We zijn erin geslaagd om op tijd te lanceren.' },
    de: { text: 'Es ist uns gelungen, pünktlich an den Start zu gehen.' },
    fr: { text: 'Nous avons réussi à lancer dans les temps.' },
    es: { text: 'Logramos hacer el lanzamiento a tiempo.' },
    it: { text: 'Siamo riusciti a lanciare nei tempi previsti.' },
    pt: { text: 'Conseguimos lançar a tempo.' },
    tr: { text: 'Zamanında lansman yapmayı başardık.' },
    pl: { text: 'Udało nam się wystartować na czas.' }
  },
  c_i_apologize_for_the_delay: {
    nl: { text: 'Mijn excuses voor de vertraging.' },
    de: { text: 'Ich entschuldige mich für die Verspätung.' },
    fr: { text: 'Je vous prie de m’excuser pour le retard.' },
    es: { text: 'Pido disculpas por el retraso.' },
    it: { text: 'Mi scuso per il ritardo.' },
    pt: { text: 'Peço desculpa pelo atraso.' },
    tr: { text: 'Gecikme için özür dilerim.' },
    pl: { text: 'Przepraszam za opóźnienie.' }
  },
  c_i_take_public_transport_to_work_daily: {
    nl: { text: 'Ik reis dagelijks met het openbaar vervoer naar mijn werk.' },
    de: { text: 'Ich fahre täglich mit den öffentlichen Verkehrsmitteln zur Arbeit.' },
    fr: { text: 'Je prends les transports en commun tous les jours pour aller au travail.' },
    es: { text: 'Voy al trabajo en transporte público todos los días.' },
    it: { text: 'Prendo i mezzi pubblici per andare al lavoro tutti i giorni.' },
    pt: { text: 'Vou para o trabalho de transportes públicos todos os dias.' },
    tr: { text: 'İşe her gün toplu taşıma ile gidiyorum.' },
    pl: { text: 'Codziennie dojeżdżam do pracy komunikacją miejską.' }
  },
  c_i_commute_by_train_every_day: {
    nl: { text: 'Ik pendel elke dag met de trein.' },
    de: { text: 'Ich pendle jeden Tag mit dem Zug.' },
    fr: { text: 'Je fais le trajet en train tous les jours.' },
    es: { text: 'Viajo en tren todos los días.' },
    it: { text: 'Faccio il pendolare in treno ogni giorno.' },
    pt: { text: 'Faço a deslocação de comboio todos os dias.' },
    tr: { text: 'Her gün trenle işe gidip geliyorum.' },
    pl: { text: 'Codziennie dojeżdżam pociągiem.' }
  },
  c_there_was_heavy_traffic_this_morning: {
    nl: { text: 'Er was vanmorgen druk verkeer.' },
    de: { text: 'Heute Morgen gab es dichten Verkehr.' },
    fr: { text: 'Il y avait beaucoup de circulation ce matin.' },
    es: { text: 'Había mucho tráfico esta mañana.' },
    it: { text: 'C’era molto traffico stamattina.' },
    pt: { text: 'Havia muito trânsito esta manhã.' },
    tr: { text: 'Bu sabah yoğun trafik vardı.' },
    pl: { text: 'Dziś rano był duży ruch na drodze.' }
  },
  c_we_enjoyed_light_traffic_on_the_way: {
    nl: { text: 'We hadden onderweg weinig verkeer.' },
    de: { text: 'Auf dem Weg hatten wir wenig Verkehr.' },
    fr: { text: 'La circulation était fluide sur notre trajet.' },
    es: { text: 'Disfrutamos de poco tráfico en el camino.' },
    it: { text: 'Abbiamo trovato poco traffico lungo la strada.' },
    pt: { text: 'Apanhámos pouco trânsito pelo caminho.' },
    tr: { text: 'Yolda rahat bir trafiğin tadını çıkardık.' },
    pl: { text: 'Po drodze cieszyliśmy się małym ruchem.' }
  },
  c_avoid_driving_during_rush_hour: {
    nl: { text: 'Vermijd autorijden tijdens de spits.' },
    de: { text: 'Vermeiden Sie es, während der Hauptverkehrszeit zu fahren.' },
    fr: { text: 'Évitez de conduire aux heures de pointe.' },
    es: { text: 'Evita conducir en hora punta.' },
    it: { text: 'Evita di guidare durante le ore di punta.' },
    pt: { text: 'Evite conduzir na hora de ponta.' },
    tr: { text: 'Yoğun saatlerde araç kullanmaktan kaçının.' },
    pl: { text: 'Unikaj jazdy samochodem w godzinach szczytu.' }
  },
  c_i_bought_a_oneway_ticket_to_london: {
    nl: { text: 'Ik heb een enkeltje naar Londen gekocht.' },
    de: { text: 'Ich habe eine einfache Fahrkarte nach London gekauft.' },
    fr: { text: 'J’ai acheté un aller simple pour Londres.' },
    es: { text: 'Compré un billete de ida a Londres.' },
    it: { text: 'Ho comprato un biglietto di sola andata per Londra.' },
    pt: { text: 'Comprei um bilhete só de ida para Londres.' },
    tr: { text: 'Londra’ya tek yönlü bilet aldım.' },
    pl: { text: 'Kupiłem bilet w jedną stronę do Londynu.' }
  },
  c_a_return_ticket_is_cheaper: {
    nl: { text: 'Een retourtje is goedkoper.' },
    de: { text: 'Eine Rückfahrkarte ist günstiger.' },
    fr: { text: 'Un billet aller-retour est moins cher.' },
    es: { text: 'Un billete de ida y vuelta es más barato.' },
    it: { text: 'Un biglietto di andata e ritorno costa meno.' },
    pt: { text: 'Um bilhete de ida e volta é mais barato.' },
    tr: { text: 'Gidiş-dönüş bileti daha ucuzdur.' },
    pl: { text: 'Bilet powrotny jest tańszy.' }
  },
  c_this_bus_route_goes_to_the_office: {
    nl: { text: 'Deze buslijn rijdt naar het kantoor.' },
    de: { text: 'Diese Buslinie fährt zum Büro.' },
    fr: { text: 'Cette ligne de bus dessert le bureau.' },
    es: { text: 'Esta línea de autobús va a la oficina.' },
    it: { text: 'Questa linea di autobus porta all’ufficio.' },
    pt: { text: 'Esta carreira de autocarro vai para o escritório.' },
    tr: { text: 'Bu otobüs güzergahı ofise gidiyor.' },
    pl: { text: 'Ta linia autobusowa jedzie do biura.' }
  },
  c_the_ticket_office_opens_at_9: {
    nl: { text: 'Het loket opent om 9 uur.' },
    de: { text: 'Der Fahrkartenschalter öffnet um 9 Uhr.' },
    fr: { text: 'Le guichet ouvre à 9 heures.' },
    es: { text: 'La taquilla abre a las 9.' },
    it: { text: 'La biglietteria apre alle 9.' },
    pt: { text: 'A bilheteira abre às 9 horas.' },
    tr: { text: 'Bilet gişesi saat 9’da açılıyor.' },
    pl: { text: 'Kasa biletowa otwiera się o 9:00.' }
  },
  c_how_much_is_the_fare_to_the_airport: {
    nl: { text: 'Hoeveel kost het tarief naar de luchthaven?' },
    de: { text: 'Wie viel kostet die Fahrt zum Flughafen?' },
    fr: { text: 'Combien coûte le trajet jusqu’à l’aéroport ?' },
    es: { text: '¿Cuánto cuesta el billete hasta el aeropuerto?' },
    it: { text: 'Quanto costa la corsa per l’aeroporto?' },
    pt: { text: 'Quanto custa a viagem até ao aeroporto?' },
    tr: { text: 'Havalimanına ücret ne kadar?' },
    pl: { text: 'Ile kosztuje przejazd na lotnisko?' }
  },

  // Portuguese C1 Phrases
  c_the_erosion_of_public_trust: {
    pt: { text: 'a erosão da confiança pública' }
  },
  c_the_committees_interim_findings: {
    pt: { text: 'as conclusões provisórias da comissão' }
  },
  c_her_reluctance_to_commit_publicly: {
    pt: { text: 'a sua relutância em comprometer-se publicamente' }
  },
  c_the_proposed_legislative_overhaul: {
    pt: { text: 'a proposta de reforma legislativa' }
  },
  c_the_widening_wealth_gap: {
    pt: { text: 'a crescente disparidade de riqueza' }
  },
  c_an_alleged_conflict_of_interest: {
    pt: { text: 'um alegado conflito de interesses' }
  },
  c_the_prevailing_public_narrative: {
    pt: { text: 'a narrativa pública dominante' }
  },
  c_the_unintended_longterm_consequences: {
    pt: { text: 'as consequências imprevistas a longo prazo' }
  },
  c_the_projects_longterm_viability: {
    pt: { text: 'a viabilidade a longo prazo do projecto' }
  },
  c_a_carefully_worded_disclaimer: {
    pt: { text: 'uma ressalva cuidadosamente redigida' }
  },
  c_the_socalled_evidence_base: {
    pt: { text: 'a chamada base de evidências' }
  },
  c_a_climate_of_institutional_caution: {
    pt: { text: 'um clima de cautela institucional' }
  },
  c_the_dwindling_room_for_compromise: {
    pt: { text: 'a margem cada vez mais reduzida para concessões' }
  },
  c_an_overreliance_on_anecdotal_data: {
    pt: { text: 'uma dependência excessiva de dados anedóticos' }
  },
  c_the_opacity_of_the_decisionmaking_process: {
    pt: { text: 'a opacidade do processo de tomada de decisão' }
  },
  c_the_commodification_of_personal_data: {
    pt: { text: 'a mercantilização dos dados pessoais' }
  },
  c_the_ethical_gray_area_involved: {
    pt: { text: 'a zona cinzenta ética envolvida' }
  },
  c_the_asymmetry_of_information_between_parties: {
    pt: { text: 'a assimetria de informação entre as partes' }
  },
  c_the_shrinking_window_for_meaningful_intervention: {
    pt: { text: 'a janela cada vez menor para uma intervenção significativa' }
  },
  c_a_chronic_underinvestment_in_prevention: {
    pt: { text: 'um subinvestimento crónico na prevenção' }
  }
};

// Merge into supplement
let updatedCount = 0;
for (const [cid, langMap] of Object.entries(translations85)) {
  if (!supplement.concept_translations[cid]) {
    supplement.concept_translations[cid] = {};
  }
  for (const [lang, obj] of Object.entries(langMap)) {
    supplement.concept_translations[cid][lang] = {
      text: obj.text,
      article: obj.article,
      source: 'generated',
      needsNativeReview: true
    };
    updatedCount++;
  }
}

fs.writeFileSync(suppPath, JSON.stringify(supplement, null, 2), 'utf-8');
console.log('Successfully updated ' + updatedCount + ' translations across ' + Object.keys(translations85).length + ' concepts in ' + suppPath);
