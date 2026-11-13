-- Expand Demo 5 photo classifications to the exact sample-gallery choices.
-- Legacy values remain accepted so saved drafts and prior submissions continue
-- to finalize safely after this forward migration.
alter table public.photographer_property_photos
  drop constraint if exists photographer_photos_classification;

alter table public.photographer_property_photos
  add constraint photographer_photos_classification check (
    (photo_type is null or (
      (photo_category = 'exterior' and photo_type in (
        'front','front_and_driveway','side_yard','front_and_side_angle','property_boundary_and_fence','rear',
        'exterior_ac_condenser','exterior_electrical_service','front_left_curb_view','right_side_elevation',
        'backyard_and_rear_elevation','roof_soffit_and_gutters','other',
        'sides','roof','yard','driveway','outbuildings','damage'
      )) or
      (photo_category = 'interior' and photo_type in (
        'living_room','dining_area','hallway_room_layout','kitchen','kitchen_under_sink_plumbing',
        'primary_bedroom','second_bedroom','bathroom','bathroom_vanity_plumbing','laundry_room','entry_foyer',
        'living_room_reverse_view','dining_room_reverse_view','kitchen_wide_view','kitchen_appliance_wall',
        'kitchen_cabinets_and_counters','primary_bedroom_reverse_view','primary_bedroom_closet',
        'second_bedroom_reverse_view','bathroom_tub_and_shower','hallway_linen_storage','mudroom_and_back_entry',
        'basement_stair_access','laundry_reverse_view','basement','basement_overview','basement_stair_landing',
        'foundation_walls','floor_drain_condition','basement_window_and_egress','basement_storage_area',
        'support_beam_and_columns','basement_exterior_exit','attic','garage','other',
        'bedroom','under_sink','damage'
      )) or
      (photo_category = 'mechanical' and photo_type in (
        'furnace_and_ductwork','modern_furnace','water_heater','water_softener','well_pump_system','breaker_panel',
        'main_water_shutoff','sump_pump','hvac_service_connections','plumbing_distribution','other',
        'hvac','electrical_panel','plumbing'
      )) or
      (photo_category = 'condition' and photo_type in ('general_condition','damage','repair_needed','other'))
    )) and
    (condition_status is null or condition_status in ('good_condition','damage')) and
    (submission_session_id is null or (
      photo_category is not null and photo_type is not null and condition_status is not null and
      client_photo_id is not null and length(btrim(client_photo_id)) > 0
    ))
  );
