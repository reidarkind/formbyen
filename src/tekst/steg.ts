type Registrer = (
  nb: string,
  nn: string,
  en: string,
  es: string,
  de: string,
  pt: string,
  sv: string,
  da: string,
  fr: string,
) => void;

/** Hver unike oppskriftssetning. Nynorsk i kataloget vinner når skjermen spør. */
export function fyllSteg(o: Registrer): void {
  o("Sett opp veggen.", "Set opp veggen.", "Put up the wall.", "Pon la pared.", "Stell die Wand auf.", "Põe a parede.", "Sätt upp väggen.", "Sæt væggen op.", "Mets le mur.");
  o("Sett inn døra.", "Set inn døra.", "Put in the door.", "Pon la puerta.", "Setz die Tür ein.", "Põe a porta.", "Sätt in dörren.", "Sæt døren i.", "Mets la porte.");
  o("Sett inn det kvadratiske vinduet.", "Set inn det kvadratiske vindauget.", "Put in the square window.", "Pon la ventana cuadrada.", "Setz das quadratische Fenster ein.", "Põe a janela quadrada.", "Sätt in det kvadratiska fönstret.", "Sæt det kvadratiske vindue i.", "Mets la fenêtre carrée.");
  o("Legg på saltaket.", "Legg på saltaket.", "Put on the pitched roof.", "Pon el tejado a dos aguas.", "Leg das Satteldach auf.", "Põe o telhado de duas águas.", "Lägg på sadeltaket.", "Læg sadeltaget på.", "Pose le toit à deux pans.");
  o("Sett opp veggene.", "Set opp veggane.", "Put up the walls.", "Pon las paredes.", "Stell die Wände auf.", "Põe as paredes.", "Sätt upp väggarna.", "Sæt væggene op.", "Mets les murs.");
  o("Sett opp den andre veggen.", "Set opp den andre veggen.", "Put up the other wall.", "Pon la otra pared.", "Stell die andere Wand auf.", "Põe a outra parede.", "Sätt upp den andra väggen.", "Sæt den anden væg op.", "Mets l'autre mur.");
  o("Sett inn det runde vinduet.", "Set inn det runde vindauget.", "Put in the round window.", "Pon la ventana redonda.", "Setz das runde Fenster ein.", "Põe a janela redonda.", "Sätt in det runda fönstret.", "Sæt det runde vindue i.", "Mets la fenêtre ronde.");
  o("Legg på taket og skorsteinen.", "Legg på taket og skorsteinen.", "Put on the roof and the chimney.", "Pon el tejado y la chimenea.", "Leg Dach und Schornstein auf.", "Põe o telhado e a chaminé.", "Lägg på taket och skorstenen.", "Læg taget og skorstenen på.", "Pose le toit et la cheminée.");
  o("Mur første etasje.", "Mur første etasje.", "Build the ground floor.", "Levanta la planta baja.", "Mauern das Erdgeschoss.", "Levanta o rés do chão.", "Mura bottenvåningen.", "Mure stuen.", "Maçonne le rez-de-chaussée.");
  o("Mur andre etasje.", "Mur andre etasje.", "Build the next floor.", "Levanta el siguiente piso.", "Mauern das nächste Stockwerk.", "Levanta o andar de cima.", "Mura nästa våning.", "Mure næste etage.", "Maçonne l'étage.");
  o("Sett inn et vindu.", "Set inn eit vindauge.", "Put in a window.", "Pon una ventana.", "Setz ein Fenster ein.", "Põe uma janela.", "Sätt in ett fönster.", "Sæt et vindue i.", "Mets une fenêtre.");
  o("Sett inn ett vindu til.", "Set inn eit vindauge til.", "Put in one more window.", "Pon una ventana más.", "Setz noch ein Fenster ein.", "Põe mais uma janela.", "Sätt in ett fönster till.", "Sæt et vindue mere i.", "Mets une fenêtre de plus.");
  o("Sett inn et vindu til.", "Set inn eit vindauge til.", "Put in one more window.", "Pon una ventana más.", "Setz noch ein Fenster ein.", "Põe mais uma janela.", "Sätt in ett fönster till.", "Sæt et vindue mere i.", "Mets une fenêtre de plus.");
  o("Mur veggene.", "Mur veggane.", "Build the walls.", "Levanta las paredes.", "Mauern die Wände.", "Levanta as paredes.", "Mura väggarna.", "Mure væggene.", "Maçonne les murs.");
  o("Sett inn buen over døra.", "Set inn bogen over døra.", "Put the arch over the door.", "Pon el arco sobre la puerta.", "Setz den Bogen über die Tür.", "Põe o arco sobre a porta.", "Sätt in bågen över dörren.", "Sæt buen over døren.", "Mets l'arc au-dessus de la porte.");
  o("Sett inn halvsirkelvinduet.", "Set inn halvsirkelvindauget.", "Put in the half-circle window.", "Pon la ventana de medio círculo.", "Setz das Halbkreisfenster ein.", "Põe a janela de meio círculo.", "Sätt in halvcirkelfönstret.", "Sæt halvcirkelvinduet i.", "Mets la fenêtre en demi-cercle.");
  o("Sett inn verandavinduet.", "Set inn verandavindauget.", "Put in the porch window.", "Pon la ventana del porche.", "Setz das Verandafenster ein.", "Põe a janela da varanda.", "Sätt in verandafönstret.", "Sæt verandavinduet i.", "Mets la fenêtre de la véranda.");
  o("Legg verandaen.", "Legg verandaen.", "Lay the porch.", "Pon el porche.", "Leg die Veranda.", "Põe a varanda.", "Lägg verandan.", "Læg verandaen.", "Pose la véranda.");
  o("Legg på det blå taket.", "Legg på det blå taket.", "Put on the blue roof.", "Pon el tejado azul.", "Leg das blaue Dach auf.", "Põe o telhado azul.", "Lägg på det blå taket.", "Læg det blå tag på.", "Pose le toit bleu.");
  o("Bygg ringmuren.", "Bygg ringmuren.", "Build the ring wall.", "Construye la muralla.", "Bau die Ringmauer.", "Constrói a muralha.", "Bygg ringmuren.", "Byg ringmuren.", "Construis le rempart.");
  o("Sett tinder på muren.", "Set tinder på muren.", "Put battlements on the wall.", "Pon almenas en el muro.", "Setz Zinnen auf die Mauer.", "Põe ameias no muro.", "Sätt tinnar på muren.", "Sæt tinder på muren.", "Mets des créneaux sur le mur.");
  o("Reis et tårn.", "Reis eit tårn.", "Raise a tower.", "Levanta una torre.", "Errichte einen Turm.", "Levanta uma torre.", "Res ett torn.", "Rejs et tårn.", "Dresse une tour.");
  o("Sett kjeglespiret på.", "Set kjeglespiret på.", "Put the cone spire on.", "Pon el chapitel cónico.", "Setz die Kegelspitze auf.", "Põe o pináculo cónico.", "Sätt konspriten på.", "Sæt keglespiret på.", "Mets la flèche en cône.");
  o("Bygg porten.", "Bygg porten.", "Build the gate.", "Construye la puerta.", "Bau das Tor.", "Constrói o portão.", "Bygg porten.", "Byg porten.", "Construis la porte.");
  o("Sett en kube til på muren.", "Set ein kube til på muren.", "Put one more cube on the wall.", "Pon un cubo más en el muro.", "Setz noch einen Würfel auf die Mauer.", "Põe mais um cubo no muro.", "Sätt en kub till på muren.", "Sæt en kube mere på muren.", "Mets un cube de plus sur le mur.");
  o("Legg tak over porten.", "Legg tak over porten.", "Put a roof over the gate.", "Pon un tejado sobre la puerta.", "Leg ein Dach über das Tor.", "Põe um telhado sobre o portão.", "Lägg tak över porten.", "Læg tag over porten.", "Pose un toit sur la porte.");
  o("Bygg første etasje.", "Bygg første etasje.", "Build the ground floor.", "Construye la planta baja.", "Bau das Erdgeschoss.", "Constrói o rés do chão.", "Bygg bottenvåningen.", "Byg stuen.", "Construis le rez-de-chaussée.");
  o("Bygg andre etasje.", "Bygg andre etasje.", "Build the next floor.", "Construye el siguiente piso.", "Bau das nächste Stockwerk.", "Constrói o andar de cima.", "Bygg nästa våning.", "Byg næste etage.", "Construis l'étage.");
  o("Reis prismetårnet.", "Reis prismetårnet.", "Raise the prism tower.", "Levanta la torre prisma.", "Errichte den Prismaturm.", "Levanta a torre prisma.", "Res prismatornet.", "Rejs prismetårnet.", "Dresse la tour prisme.");
  o("Sett på pyramidetaket.", "Set på pyramidetaket.", "Put on the pyramid roof.", "Pon el tejado pirámide.", "Setz das Pyramidendach auf.", "Põe o telhado pirâmide.", "Sätt på pyramidtaket.", "Sæt pyramidetaget på.", "Mets le toit pyramide.");
  o("Åpne porten til festsalen.", "Opne porten til festsalen.", "Open the gate to the hall.", "Abre la puerta del salón.", "Öffne das Tor zum Festsaal.", "Abre o portão para o salão.", "Öppna porten till festsalen.", "Åbn porten til festsalen.", "Ouvre la porte de la salle.");
  o("Sett inn sekskantvinduet.", "Set inn sekskantvindauget.", "Put in the hexagon window.", "Pon la ventana hexagonal.", "Setz das Sechseckfenster ein.", "Põe a janela hexagonal.", "Sätt in sexkantfönstret.", "Sæt sekskantvinduet i.", "Mets la fenêtre hexagonale.");
  o("Sett søyler i salen.", "Set søyler i salen.", "Put columns in the hall.", "Pon columnas en el salón.", "Setz Säulen in den Saal.", "Põe colunas no salão.", "Sätt pelare i salen.", "Sæt søjler i salen.", "Mets des colonnes dans la salle.");
  o("Legg kuppelen.", "Legg kuppelen.", "Put on the dome.", "Pon la cúpula.", "Leg die Kuppel auf.", "Põe a cúpula.", "Lägg kupolen.", "Læg kuplen.", "Pose le dôme.");
  o("Sett sylinderen som brønn.", "Set sylinderen som brønn.", "Set the cylinder as a well.", "Pon el cilindro como pozo.", "Setz den Zylinder als Brunnen.", "Põe o cilindro como poço.", "Sätt cylindern som brunn.", "Sæt cylinderen som brønd.", "Mets le cylindre comme puits.");
  o("Mur kanten.", "Mur kanten.", "Build the rim.", "Levanta el borde.", "Mauern den Rand.", "Levanta a borda.", "Mura kanten.", "Mure kanten.", "Maçonne le bord.");
  o("Legg det lille taket.", "Legg det vesle taket.", "Put on the little roof.", "Pon el tejado pequeño.", "Leg das kleine Dach auf.", "Põe o telhado pequeno.", "Lägg det lilla taket.", "Læg det lille tag.", "Pose le petit toit.");
  o("Sett første planke.", "Set første planke.", "Set the first plank.", "Pon el primer tablón.", "Setz die erste Planke.", "Põe a primeira tábua.", "Sätt första plankan.", "Sæt første planke.", "Mets la première planche.");
  o("Sett neste planke i mønsteret.", "Set neste planke i mønsteret.", "Set the next plank in the pattern.", "Pon el siguiente tablón del patrón.", "Setz die nächste Planke im Muster.", "Põe a tábua seguinte do padrão.", "Sätt nästa planka i mönstret.", "Sæt næste planke i mønsteret.", "Mets la planche suivante du motif.");
  o("Fullfør gjerdet.", "Fullfør gjerdet.", "Finish the fence.", "Termina la valla.", "Mach den Zaun fertig.", "Acaba a cerca.", "Gör klart staketet.", "Gør hegnet færdigt.", "Finis la clôture.");
  o("Sett opp skjulet.", "Set opp skjulet.", "Put up the shed.", "Pon el cobertizo.", "Stell den Schuppen auf.", "Põe o telheiro.", "Sätt upp skjulet.", "Sæt skuret op.", "Mets l'abri.");
  o("Legg vedplanker.", "Legg vedplankar.", "Lay the firewood planks.", "Pon los tablones de leña.", "Leg die Holzplanken.", "Põe as tábuas de lenha.", "Lägg vedplankor.", "Læg brændeplanker.", "Pose les planches de bois.");
  o("Sett på døra.", "Set på døra.", "Put the door on.", "Pon la puerta.", "Setz die Tür auf.", "Põe a porta.", "Sätt på dörren.", "Sæt døren på.", "Mets la porte.");
  o("Legg taket.", "Legg taket.", "Put on the roof.", "Pon el tejado.", "Leg das Dach auf.", "Põe o telhado.", "Lägg taket.", "Læg taget.", "Pose le toit.");
  o("Mur bakeriet.", "Mur bakeriet.", "Build the bakery.", "Levanta la panadería.", "Mauern die Bäckerei.", "Levanta a padaria.", "Mura bageriet.", "Mure bageriet.", "Maçonne la boulangerie.");
  o("Sett inn det store vinduet.", "Set inn det store vindauget.", "Put in the big window.", "Pon la ventana grande.", "Setz das große Fenster ein.", "Põe a janela grande.", "Sätt in det stora fönstret.", "Sæt det store vindue i.", "Mets la grande fenêtre.");
  o("Heng kringle-skiltet.", "Heng kringle-skiltet.", "Hang the pretzel sign.", "Cuelga el cartel del pretzel.", "Häng das Brezel-Schild auf.", "Pendura a placa do pretzel.", "Häng kringelskylten.", "Hæng kringle-skiltet.", "Accroche l'enseigne du bretzel.");
  o("Legg saltaket.", "Legg saltaket.", "Lay the pitched roof.", "Pon el tejado a dos aguas.", "Leg das Satteldach.", "Põe o telhado de duas águas.", "Lägg sadeltaket.", "Læg sadeltaget.", "Pose le toit à deux pans.");
  o("Bygg klatrestativet.", "Bygg klatrestativet.", "Build the climbing frame.", "Construye el trepador.", "Bau das Klettergerüst.", "Constrói o trepa-trepa.", "Bygg klätterställningen.", "Byg klatrestativet.", "Construis le portique.");
  o("Legg ballen klar.", "Legg ballen klar.", "Put the ball ready.", "Deja el balón listo.", "Leg den Ball bereit.", "Deixa a bola pronta.", "Lägg bollen klar.", "Læg bolden klar.", "Pose le ballon.");
  o("Sett en kube å hoppe på.", "Set ein kube å hoppe på.", "Set a cube to jump on.", "Pon un cubo para saltar.", "Setz einen Würfel zum Hüpfen.", "Põe um cubo para saltar.", "Sätt en kub att hoppa på.", "Sæt en kube at hoppe på.", "Mets un cube pour sauter.");
  o("Legg den ene brukara.", "Legg den eine brukara.", "Lay one bridge side.", "Pon un lado del puente.", "Leg eine Brückenseite.", "Põe um lado da ponte.", "Lägg den ena brokanten.", "Læg den ene brokant.", "Pose un côté du pont.");
  o("Mur buen.", "Mur bogen.", "Build the arch.", "Levanta el arco.", "Mauern den Bogen.", "Levanta o arco.", "Mura bågen.", "Mure buen.", "Maçonne l'arc.");
  o("Sett rekkverket.", "Set rekkverket.", "Set the railing.", "Pon la barandilla.", "Setz das Geländer.", "Põe o corrimão.", "Sätt räcket.", "Sæt rækværket.", "Mets la rambarde.");
  o("Legg dekket.", "Legg dekket.", "Lay the deck.", "Pon la cubierta.", "Leg die Decke.", "Põe o tabuleiro.", "Lägg däcket.", "Læg dækket.", "Pose le tablier.");
  o("Mur skolen.", "Mur skulen.", "Build the school.", "Levanta la escuela.", "Mauern die Schule.", "Levanta a escola.", "Mura skolan.", "Mure skolen.", "Maçonne l'école.");
  o("Sett inn et kvadratvindu.", "Set inn eit kvadratvindauge.", "Put in a square window.", "Pon una ventana cuadrada.", "Setz ein Quadratfenster ein.", "Põe uma janela quadrada.", "Sätt in ett kvadratfönster.", "Sæt et kvadratvindue i.", "Mets une fenêtre carrée.");
  o("Sett inn vinduet ved siden av.", "Set inn vindauget ved sida av.", "Put in the window beside it.", "Pon la ventana de al lado.", "Setz das Fenster daneben ein.", "Põe a janela ao lado.", "Sätt in fönstret bredvid.", "Sæt vinduet ved siden af.", "Mets la fenêtre d'à côté.");
  o("Sett inn døra med klokke over.", "Set inn døra med klokke over.", "Put in the door with a clock above.", "Pon la puerta con reloj arriba.", "Setz die Tür mit Uhr darüber ein.", "Põe a porta com relógio por cima.", "Sätt in dörren med klocka över.", "Sæt døren med ur over i.", "Mets la porte avec une horloge au-dessus.");
  o("Legg det flate taket.", "Legg det flate taket.", "Put on the flat roof.", "Pon el tejado plano.", "Leg das flache Dach auf.", "Põe o telhado plano.", "Lägg det platta taket.", "Læg det flade tag.", "Pose le toit plat.");
  o("Reis hallen.", "Reis hallen.", "Raise the hall.", "Levanta el pabellón.", "Errichte die Halle.", "Levanta o pavilhão.", "Res hallen.", "Rejs hallen.", "Dresse le gymnase.");
  o("Sett den andre langveggen.", "Set den andre langveggen.", "Set the other long wall.", "Pon la otra pared larga.", "Setz die andere lange Wand.", "Põe a outra parede comprida.", "Sätt den andra långväggen.", "Sæt den anden langvæg.", "Mets l'autre long mur.");
  o("Sett inn de høye vinduene.", "Set inn dei høge vindauga.", "Put in the tall windows.", "Pon las ventanas altas.", "Setz die hohen Fenster ein.", "Põe as janelas altas.", "Sätt in de höga fönstren.", "Sæt de høje vinduer i.", "Mets les hautes fenêtres.");
  o("Sett opp lokalet.", "Set opp lokalet.", "Put up the room.", "Pon el local.", "Stell den Raum auf.", "Põe a sala.", "Sätt upp lokalen.", "Sæt lokalet op.", "Mets la salle.");
  o("Sett sirkelen i gavlen.", "Set sirkelen i gavlen.", "Set the circle in the gable.", "Pon el círculo en el hastial.", "Setz den Kreis in den Giebel.", "Põe o círculo no frontão.", "Sätt cirkeln i gaveln.", "Sæt cirklen i gavlen.", "Mets le cercle dans le pignon.");
  o("Mur musikkskolen.", "Mur musikkskulen.", "Build the music school.", "Levanta la escuela de música.", "Mauern die Musikschule.", "Levanta a escola de música.", "Mura musikskolan.", "Mure musikskolen.", "Maçonne l'école de musique.");
  o("Sett inn halvsirkeldøra.", "Set inn halvsirkeldøra.", "Put in the half-circle door.", "Pon la puerta de medio círculo.", "Setz die Halbkreistür ein.", "Põe a porta de meio círculo.", "Sätt in halvcirkeldörren.", "Sæt halvcirkeldøren i.", "Mets la porte en demi-cercle.");
  o("Mur biblioteket.", "Mur biblioteket.", "Build the library.", "Levanta la biblioteca.", "Mauern die Bibliothek.", "Levanta a biblioteca.", "Mura biblioteket.", "Mure biblioteket.", "Maçonne la bibliothèque.");
  o("Sett opp søylene.", "Set opp søylene.", "Put up the columns.", "Pon las columnas.", "Stell die Säulen auf.", "Põe as colunas.", "Sätt upp pelarna.", "Sæt søjlerne op.", "Mets les colonnes.");
  o("Sett inn vinduet.", "Set inn vindauget.", "Put in the window.", "Pon la ventana.", "Setz das Fenster ein.", "Põe a janela.", "Sätt in fönstret.", "Sæt vinduet i.", "Mets la fenêtre.");
  o("Legg trekantgavlen.", "Legg trekantgavlen.", "Put on the triangle gable.", "Pon el hastial triangular.", "Leg den Dreiecksgiebel auf.", "Põe o frontão triangular.", "Lägg trianglegaveln.", "Læg trekanthavlen.", "Pose le pignon triangle.");
  o("Bygg stasjonen.", "Bygg stasjonen.", "Build the station.", "Construye la estación.", "Bau den Bahnhof.", "Constrói a estação.", "Bygg stationen.", "Byg stationen.", "Construis la gare.");
  o("Heng opp den store urskiven.", "Heng opp den store urskiva.", "Hang the big clock face.", "Cuelga la esfera grande.", "Häng das große Zifferblatt auf.", "Pendura o mostrador grande.", "Häng upp den stora urtavlan.", "Hæng den store urskive op.", "Accroche le grand cadran.");
  o("Mur kirken.", "Mur kyrkja.", "Build the church.", "Levanta la iglesia.", "Mauern die Kirche.", "Levanta a igreja.", "Mura kyrkan.", "Mure kirken.", "Maçonne l'église.");
  o("Reis tårnet.", "Reis tårnet.", "Raise the tower.", "Levanta la torre.", "Errichte den Turm.", "Levanta a torre.", "Res tornet.", "Rejs tårnet.", "Dresse la tour.");
  o("Sett spiret på.", "Set spiret på.", "Put the spire on.", "Pon el chapitel.", "Setz die Spitze auf.", "Põe o pináculo.", "Sätt spiran på.", "Sæt spiret på.", "Mets la flèche.");
  o("Sett inn det buete vinduet.", "Set inn det boga vindauget.", "Put in the arched window.", "Pon la ventana arqueada.", "Setz das Bogenfenster ein.", "Põe a janela em arco.", "Sätt in det bågiga fönstret.", "Sæt det buede vindue i.", "Mets la fenêtre en arc.");
  o("Sett søylene.", "Set søylene.", "Set the columns.", "Pon las columnas.", "Setz die Säulen.", "Põe as colunas.", "Sätt pelarna.", "Sæt søjlerne.", "Mets les colonnes.");
  o("Løft tanken opp.", "Lyft tanken opp.", "Lift the tank up.", "Sube el depósito.", "Heb den Tank hoch.", "Levanta o depósito.", "Lyft tanken upp.", "Løft tanken op.", "Lève le réservoir.");
  o("Fest tanken.", "Fest tanken.", "Fasten the tank.", "Fija el depósito.", "Befestige den Tank.", "Prende o depósito.", "Fäst tanken.", "Fastgør tanken.", "Fixe le réservoir.");
  o("Reis det høye tårnet.", "Reis det høge tårnet.", "Raise the tall tower.", "Levanta la torre alta.", "Errichte den hohen Turm.", "Levanta a torre alta.", "Res det höga tornet.", "Rejs det høje tårn.", "Dresse la haute tour.");
  o("Bygg ett nivå til.", "Bygg eitt nivå til.", "Build one more level.", "Construye un nivel más.", "Bau noch eine Ebene.", "Constrói mais um nível.", "Bygg en nivå till.", "Byg et niveau mere.", "Construis un niveau de plus.");
  o("Sett kjegletaket.", "Set kjegletaket.", "Set the cone roof.", "Pon el tejado cónico.", "Setz das Kegeldach.", "Põe o telhado cónico.", "Sätt kontaket.", "Sæt kegletaget.", "Mets le toit cône.");
  o("Tenn lykten.", "Tenn lykta.", "Light the lantern.", "Enciende el farol.", "Zünde die Laterne an.", "Acende a lanterna.", "Tänd lyktan.", "Tænd lygten.", "Allume la lanterne.");
  o("Legg første del av muren.", "Legg første del av muren.", "Lay the first part of the wall.", "Pon la primera parte del muro.", "Leg den ersten Teil der Mauer.", "Põe a primeira parte do muro.", "Lägg första delen av muren.", "Læg første del af muren.", "Pose la première partie du mur.");
  o("Fortsett muren.", "Fortsett muren.", "Continue the wall.", "Sigue el muro.", "Bau die Mauer weiter.", "Continua o muro.", "Fortsätt muren.", "Fortsæt muren.", "Continue le mur.");
  o("Sett tinder.", "Set tinder.", "Set the battlements.", "Pon las almenas.", "Setz die Zinnen.", "Põe as ameias.", "Sätt tinnarna.", "Sæt tinderne.", "Mets les créneaux.");
  o("Sett et hjørnetårn.", "Set eit hjørnetårn.", "Set a corner tower.", "Pon una torre de esquina.", "Setz einen Eckturm.", "Põe uma torre de canto.", "Sätt ett hörntorn.", "Sæt et hjørnetårn.", "Mets une tour d'angle.");
  o("Legg gresset.", "Legg graset.", "Lay the grass.", "Pon el césped.", "Leg das Gras.", "Põe a relva.", "Lägg gräset.", "Læg græsset.", "Pose l'herbe.");
  o("Sett en benk.", "Set ein benk.", "Set a bench.", "Pon un banco.", "Setz eine Bank.", "Põe um banco.", "Sätt en bänk.", "Sæt en bænk.", "Mets un banc.");
  o("Bygg fontenen.", "Bygg fontena.", "Build the fountain.", "Construye la fuente.", "Bau den Brunnen.", "Constrói a fonte.", "Bygg fontänen.", "Byg fontænen.", "Construis la fontaine.");
  o("Mal kanten.", "Mal kanten.", "Paint the edge.", "Pinta el borde.", "Streich den Rand.", "Pinta a borda.", "Måla kanten.", "Mal kanten.", "Peins le bord.");
  o("Legg steinhellene.", "Legg steinhellene.", "Lay the stone slabs.", "Pon las losas.", "Leg die Steinplatten.", "Põe as lajes.", "Lägg stenhällarna.", "Læg stenfliserne.", "Pose les dalles.");
  o("Sett opp scenen.", "Set opp scena.", "Put up the stage.", "Pon el escenario.", "Stell die Bühne auf.", "Põe o palco.", "Sätt upp scenen.", "Sæt scenen op.", "Mets la scène.");
  o("Mal gulvet.", "Mal golvet.", "Paint the floor.", "Pinta el suelo.", "Streich den Boden.", "Pinta o chão.", "Måla golvet.", "Mal gulvet.", "Peins le sol.");
  o("Sett hjørnesteinene.", "Set hjørnesteinane.", "Set the corner stones.", "Pon las piedras de esquina.", "Setz die Ecksteine.", "Põe as pedras de canto.", "Sätt hörnstenarna.", "Sæt hjørnestenene.", "Mets les pierres d'angle.");
  o("Sett kuben nederst.", "Set kuben nedst.", "Set the cube at the bottom.", "Pon el cubo abajo.", "Setz den Würfel unten.", "Põe o cubo em baixo.", "Sätt kuben nederst.", "Sæt kuben nederst.", "Mets le cube en bas.");
  o("Sett prismet oppå.", "Set prismet oppå.", "Set the prism on top.", "Pon el prisma encima.", "Setz das Prisma obenauf.", "Põe o prisma por cima.", "Sätt prismat ovanpå.", "Sæt prismet ovenpå.", "Mets le prisme dessus.");
  o("Heng urskiven på den ene siden.", "Heng urskiva på den eine sida.", "Hang the clock face on one side.", "Cuelga la esfera en un lado.", "Häng das Zifferblatt an eine Seite.", "Pendura o mostrador num lado.", "Häng urtavlan på den ena sidan.", "Hæng urskiven på den ene side.", "Accroche le cadran d'un côté.");
  o("Heng urskiven på den andre siden.", "Heng urskiva på den andre sida.", "Hang the clock face on the other side.", "Cuelga la esfera en el otro lado.", "Häng das Zifferblatt an die andere Seite.", "Pendura o mostrador no outro lado.", "Häng urtavlan på den andra sidan.", "Hæng urskiven på den anden side.", "Accroche le cadran de l'autre côté.");
  o("Sett pyramidetaket.", "Set pyramidetaket.", "Set the pyramid roof.", "Pon el tejado pirámide.", "Setz das Pyramidendach.", "Põe o telhado pirâmide.", "Sätt pyramidtaket.", "Sæt pyramidetaget.", "Mets le toit pyramide.");
  o("Legg den siste steinen.", "Legg den siste steinen.", "Lay the last stone.", "Pon la última piedra.", "Leg den letzten Stein.", "Põe a última pedra.", "Lägg den sista stenen.", "Læg den sidste sten.", "Pose la dernière pierre.");
}
