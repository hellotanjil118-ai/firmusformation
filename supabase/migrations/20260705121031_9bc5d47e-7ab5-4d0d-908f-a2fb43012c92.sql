CREATE POLICY "Admins select documents storage" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert documents storage" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update documents storage" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete documents storage" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));