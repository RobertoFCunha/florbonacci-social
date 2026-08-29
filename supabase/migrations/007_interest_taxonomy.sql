-- ============================================================
-- FLORBONACCI SOCIAL
-- Migration 007 — Taxonomia inicial de interesses
-- Fonte: exportação real de public.interests (36 registros)
-- ============================================================

insert into public.interests (
  id, name, slug, description, parent_id, image_path, status, created_at
)
values
  ('c420fbf8-30a8-4543-b6e5-fef57b94f20e'::uuid, 'Água', 'agua', 'Movimento, estados, ciclos e fenômenos relacionados à água.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('5e1d37e6-6e3a-4577-97ba-0562a2c898a2'::uuid, 'Arquitetura', 'arquitetura', 'Edificações, estruturas, detalhes arquitetônicos e formas de ocupar espaços.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('f5c37c8d-c8fe-42fd-b84e-8b97e1ef2b1b'::uuid, 'Arte Urbana', 'arte-urbana', 'Grafites, murais, intervenções e expressões artísticas encontradas nas cidades.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('bd139941-d60a-45ea-8f58-09797b132f27'::uuid, 'Árvores', 'arvores', 'Árvores, troncos, copas, folhas, frutos e relações com o ambiente.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('679e927e-6e2a-4ef4-b192-e78572d7cc8f'::uuid, 'Astronomia', 'astronomia', 'Estrelas, planetas, constelações e outros objetos celestes.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('e92537e4-8961-4902-93ae-3c3255a03fa5'::uuid, 'Aves', 'aves', 'Aves urbanas, silvestres, seus comportamentos, cores e habitats.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('f745ce41-7228-428b-8618-da025d304b84'::uuid, 'Céu e Universo', 'ceu-e-universo', 'Astronomia, atmosfera, céu e fenômenos observados acima de nós.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('a663eefa-8b05-467c-bbdd-a88eb7b4fe5b'::uuid, 'Ciência no Cotidiano', 'ciencia-no-cotidiano', 'Fenômenos, perguntas e descobertas científicas presentes na vida diária.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('efab2f60-9a73-4174-8f3c-30d4f9ef914f'::uuid, 'Espirais', 'espirais', 'Espirais naturais, geométricas, arquitetônicas e visuais.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('18e8357c-2cde-4396-a82a-8ebbd2c5218f'::uuid, 'Fenômenos Atmosféricos', 'fenomenos-atmosfericos', 'Arco-íris, halos, tempestades, raios e outros fenômenos da atmosfera.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('d748a38f-2c19-4630-bec3-957e1b67d9cd'::uuid, 'Fibonacci na Natureza', 'fibonacci-na-natureza', 'Espirais, proporções e organizações relacionadas à sequência de Fibonacci.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('12639be3-d018-431e-8466-788125c52cdb'::uuid, 'Flores', 'flores', 'Flores silvestres, cultivadas e suas formas, cores e ciclos.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('2953a852-22c6-4e67-8c6e-c0583d9eeaaf'::uuid, 'Flores Silvestres', 'flores-silvestres', 'Flores encontradas espontaneamente em ambientes naturais e urbanos.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('b45590a7-5841-4a0c-b39c-dc2c74a2d007'::uuid, 'Folhas', 'folhas', 'Formas, nervuras, texturas, cores e transformações das folhas.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('35bbaed0-5f78-4dee-a26b-c771f2dc5b67'::uuid, 'Fotografia de Natureza', 'fotografia-de-natureza', 'Registros fotográficos de organismos, paisagens e fenômenos naturais.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('a08973ea-1bda-4caa-8097-d44ed661314f'::uuid, 'Fotografia e Imagem', 'fotografia-e-imagem', 'Olhares, registros visuais, técnicas e formas de observar através da imagem.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('38567840-9a56-4704-bc52-549b0d0bbc9d'::uuid, 'Fotografia Urbana', 'fotografia-urbana', 'Cenas, detalhes, pessoas e formas observadas nos espaços urbanos.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('45860fb3-c3b7-4027-b15f-7d0208702fc2'::uuid, 'Frutos e Sementes', 'frutos-e-sementes', 'Frutos, sementes, dispersão e diferentes estratégias das plantas.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('d0a23d23-d0f3-44d4-9b6d-6871ae59d723'::uuid, 'Fungos', 'fungos', 'Cogumelos, fungos e suas formas de vida e ocorrência.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('feb7cae0-6389-483a-9d7f-141c0827d9f7'::uuid, 'Geometria no Mundo', 'geometria-no-mundo', 'Formas e relações geométricas encontradas no cotidiano.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('8f8900f3-005c-4adf-87b3-cf8640208497'::uuid, 'História Local', 'historia-local', 'Memórias, acontecimentos, personagens e transformações de um lugar.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('b944da51-eb02-4947-b8b3-0d2e7f12deb8'::uuid, 'Insetos', 'insetos', 'Insetos, seus ciclos, formas, comportamentos e relações ecológicas.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('01624495-cb41-4fbf-9dcf-f4fead767b34'::uuid, 'Jardinagem', 'jardinagem', 'Cultivo, cuidado e observação de plantas em jardins e espaços domésticos.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('57dc2911-0c73-4557-aa82-33169dd61ed0'::uuid, 'Lua', 'lua', 'Fases, aparência, posição e observações da Lua.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('88d82d6c-8755-4dca-a9c1-62e2f22fe2c6'::uuid, 'Lugares e História', 'lugares-e-historia', 'Arquitetura, patrimônio, lugares, memória e histórias locais.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('76828856-e8dc-4699-bac8-8aa02bcf3cbb'::uuid, 'Luz e Cor', 'luz-e-cor', 'Reflexos, sombras, refração, cores e fenômenos ópticos do cotidiano.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('3b113ad4-4a49-401e-93fd-b82ae5e4ad77'::uuid, 'Macrofotografia', 'macrofotografia', 'Pequenos detalhes revelados por aproximação e ampliação fotográfica.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('25df548d-6079-456b-ac54-5fcccb948951'::uuid, 'Natureza', 'natureza', 'Vida, paisagens, organismos e fenômenos do mundo natural.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('46512714-4048-45a7-b208-2a5240b7260d'::uuid, 'Nuvens', 'nuvens', 'Formações, tipos, movimentos e transformações das nuvens.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('178de410-c91e-4375-a470-b4f469531376'::uuid, 'Orquídeas', 'orquideas', 'Orquídeas, espécies, variedades, formas e ambientes.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('654ecd12-b362-42b2-bf32-9092364dae1c'::uuid, 'Padrões e Formas', 'padroes-e-formas', 'Geometrias, simetrias, proporções e padrões percebidos no mundo.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('4ba28d91-97a1-4daf-af9c-f4937fa77d3f'::uuid, 'Paisagens', 'paisagens', 'Paisagens naturais e suas transformações ao longo do tempo.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('5b549122-c5af-4d07-b7cf-9744def02d4b'::uuid, 'Patrimônio', 'patrimonio', 'Bens materiais, paisagens e referências culturais que guardam memória.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('e3588d3a-c298-4934-93d1-8330f55b23ba'::uuid, 'Simetria', 'simetria', 'Simetrias observadas na natureza, objetos, construções e imagens.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('32074695-47f7-4aa3-aae9-1f2e56ca6da8'::uuid, 'Som', 'som', 'Sons, vibrações e fenômenos acústicos percebidos no cotidiano.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz),
  ('71c1bf45-13a8-4c67-afac-430d21331e44'::uuid, 'Tecnologia ao Redor', 'tecnologia-ao-redor', 'Tecnologias, mecanismos e soluções que despertam curiosidade no dia a dia.', null, null, 'active', '2026-08-29 01:19:31.09931+00'::timestamptz)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  image_path = excluded.image_path,
  status = excluded.status;

-- Relações hierárquicas são aplicadas depois da inserção,
-- evitando dependência da ordem entre pais e filhos.

update public.interests
set parent_id = 'a663eefa-8b05-467c-bbdd-a88eb7b4fe5b'::uuid
where id = 'c420fbf8-30a8-4543-b6e5-fef57b94f20e'::uuid;

update public.interests
set parent_id = '88d82d6c-8755-4dca-a9c1-62e2f22fe2c6'::uuid
where id = '5e1d37e6-6e3a-4577-97ba-0562a2c898a2'::uuid;

update public.interests
set parent_id = '88d82d6c-8755-4dca-a9c1-62e2f22fe2c6'::uuid
where id = 'f5c37c8d-c8fe-42fd-b84e-8b97e1ef2b1b'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = 'bd139941-d60a-45ea-8f58-09797b132f27'::uuid;

update public.interests
set parent_id = 'f745ce41-7228-428b-8618-da025d304b84'::uuid
where id = '679e927e-6e2a-4ef4-b192-e78572d7cc8f'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = 'e92537e4-8961-4902-93ae-3c3255a03fa5'::uuid;

update public.interests
set parent_id = '654ecd12-b362-42b2-bf32-9092364dae1c'::uuid
where id = 'efab2f60-9a73-4174-8f3c-30d4f9ef914f'::uuid;

update public.interests
set parent_id = 'f745ce41-7228-428b-8618-da025d304b84'::uuid
where id = '18e8357c-2cde-4396-a82a-8ebbd2c5218f'::uuid;

update public.interests
set parent_id = '654ecd12-b362-42b2-bf32-9092364dae1c'::uuid
where id = 'd748a38f-2c19-4630-bec3-957e1b67d9cd'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = '12639be3-d018-431e-8466-788125c52cdb'::uuid;

update public.interests
set parent_id = '12639be3-d018-431e-8466-788125c52cdb'::uuid
where id = '2953a852-22c6-4e67-8c6e-c0583d9eeaaf'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = 'b45590a7-5841-4a0c-b39c-dc2c74a2d007'::uuid;

update public.interests
set parent_id = 'a08973ea-1bda-4caa-8097-d44ed661314f'::uuid
where id = '35bbaed0-5f78-4dee-a26b-c771f2dc5b67'::uuid;

update public.interests
set parent_id = 'a08973ea-1bda-4caa-8097-d44ed661314f'::uuid
where id = '38567840-9a56-4704-bc52-549b0d0bbc9d'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = '45860fb3-c3b7-4027-b15f-7d0208702fc2'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = 'd0a23d23-d0f3-44d4-9b6d-6871ae59d723'::uuid;

update public.interests
set parent_id = '654ecd12-b362-42b2-bf32-9092364dae1c'::uuid
where id = 'feb7cae0-6389-483a-9d7f-141c0827d9f7'::uuid;

update public.interests
set parent_id = '88d82d6c-8755-4dca-a9c1-62e2f22fe2c6'::uuid
where id = '8f8900f3-005c-4adf-87b3-cf8640208497'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = 'b944da51-eb02-4947-b8b3-0d2e7f12deb8'::uuid;

update public.interests
set parent_id = '12639be3-d018-431e-8466-788125c52cdb'::uuid
where id = '01624495-cb41-4fbf-9dcf-f4fead767b34'::uuid;

update public.interests
set parent_id = 'f745ce41-7228-428b-8618-da025d304b84'::uuid
where id = '57dc2911-0c73-4557-aa82-33169dd61ed0'::uuid;

update public.interests
set parent_id = 'a663eefa-8b05-467c-bbdd-a88eb7b4fe5b'::uuid
where id = '76828856-e8dc-4699-bac8-8aa02bcf3cbb'::uuid;

update public.interests
set parent_id = 'a08973ea-1bda-4caa-8097-d44ed661314f'::uuid
where id = '3b113ad4-4a49-401e-93fd-b82ae5e4ad77'::uuid;

update public.interests
set parent_id = 'f745ce41-7228-428b-8618-da025d304b84'::uuid
where id = '46512714-4048-45a7-b208-2a5240b7260d'::uuid;

update public.interests
set parent_id = '12639be3-d018-431e-8466-788125c52cdb'::uuid
where id = '178de410-c91e-4375-a470-b4f469531376'::uuid;

update public.interests
set parent_id = '25df548d-6079-456b-ac54-5fcccb948951'::uuid
where id = '4ba28d91-97a1-4daf-af9c-f4937fa77d3f'::uuid;

update public.interests
set parent_id = '88d82d6c-8755-4dca-a9c1-62e2f22fe2c6'::uuid
where id = '5b549122-c5af-4d07-b7cf-9744def02d4b'::uuid;

update public.interests
set parent_id = '654ecd12-b362-42b2-bf32-9092364dae1c'::uuid
where id = 'e3588d3a-c298-4934-93d1-8330f55b23ba'::uuid;

update public.interests
set parent_id = 'a663eefa-8b05-467c-bbdd-a88eb7b4fe5b'::uuid
where id = '32074695-47f7-4aa3-aae9-1f2e56ca6da8'::uuid;

update public.interests
set parent_id = 'a663eefa-8b05-467c-bbdd-a88eb7b4fe5b'::uuid
where id = '71c1bf45-13a8-4c67-afac-430d21331e44'::uuid;

-- Fim da Migration 007.
