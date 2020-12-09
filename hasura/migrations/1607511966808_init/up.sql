CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public.bounding_boxes (
    image_name character varying NOT NULL,
    seq integer NOT NULL,
    class_name character varying NOT NULL,
    confidence integer NOT NULL,
    "left" integer NOT NULL,
    "right" integer NOT NULL,
    top integer NOT NULL,
    bottom integer NOT NULL
);
CREATE TABLE public.cameras (
    camera_id character varying NOT NULL,
    camera_name character varying NOT NULL,
    description character varying,
    file_pattern character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.captures (
    image_name character varying NOT NULL,
    camera_id character varying NOT NULL,
    image_base64 text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE VIEW public.capture_trail_view AS
 WITH cte_ AS (
         SELECT cc.camera_id,
            bb.image_name,
            bb.class_name,
            count(bb.class_name) AS _count,
            cc.created_at
           FROM (public.bounding_boxes bb
             JOIN public.captures cc ON (((bb.image_name)::text = (cc.image_name)::text)))
          GROUP BY cc.camera_id, bb.image_name, bb.class_name, cc.created_at
        )
 SELECT cte_.camera_id,
    cte_.image_name,
    string_agg(concat(cte_.class_name, '(', cte_._count, ')'), ', '::text) AS classes,
    cte_.created_at AS captured_at
   FROM cte_
  GROUP BY cte_.camera_id, cte_.image_name, cte_.created_at;
CREATE VIEW public.capture_latest_view AS
 WITH cte0 AS (
         SELECT capture_trail_view.camera_id,
            capture_trail_view.image_name,
            capture_trail_view.captured_at,
            row_number() OVER (PARTITION BY capture_trail_view.camera_id ORDER BY capture_trail_view.captured_at DESC) AS seq
           FROM public.capture_trail_view
          ORDER BY capture_trail_view.captured_at DESC
        )
 SELECT c.camera_id,
    c.image_name,
    vw.classes,
    c.captured_at
   FROM (cte0 c
     JOIN public.capture_trail_view vw ON (((c.image_name)::text = (vw.image_name)::text)))
  WHERE (c.seq = 1)
  ORDER BY c.camera_id;
CREATE TABLE public.configs (
    name character varying NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.targets (
    camera_id character varying NOT NULL,
    class_name character varying NOT NULL,
    min_confidence integer DEFAULT 70 NOT NULL,
    max_confidence integer DEFAULT 100 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.bounding_boxes
    ADD CONSTRAINT bounding_boxes_pkey PRIMARY KEY (image_name, seq);
ALTER TABLE ONLY public.cameras
    ADD CONSTRAINT cameras_pkey PRIMARY KEY (camera_id);
ALTER TABLE ONLY public.captures
    ADD CONSTRAINT captures_pkey PRIMARY KEY (image_name);
ALTER TABLE ONLY public.configs
    ADD CONSTRAINT configs_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.targets
    ADD CONSTRAINT target_pkey PRIMARY KEY (camera_id, class_name);
CREATE TRIGGER set_public_cameras_updated_at BEFORE UPDATE ON public.cameras FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_cameras_updated_at ON public.cameras IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_configs_updated_at BEFORE UPDATE ON public.configs FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_configs_updated_at ON public.configs IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_target_updated_at BEFORE UPDATE ON public.targets FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_target_updated_at ON public.targets IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.bounding_boxes
    ADD CONSTRAINT bounding_boxes_image_name_fkey FOREIGN KEY (image_name) REFERENCES public.captures(image_name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.captures
    ADD CONSTRAINT captures_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.cameras(camera_id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.targets
    ADD CONSTRAINT target_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.cameras(camera_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


INSERT INTO public.configs (name, value, updated_at) VALUES ('TARGET_PATH', NULL, '2020-12-09 11:07:11.215529+00');
INSERT INTO public.configs (name, value, updated_at) VALUES ('OBJECT_DETECTION_URI', NULL, '2020-12-09 11:07:17.831801+00');
