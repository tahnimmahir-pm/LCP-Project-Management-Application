/*
  # Database Function: Calculate Project Progress
  
  Logic:
  1. Each Project has Pillars (with weights, total 100%).
  2. Each Pillar has Tasks.
  3. Pillar Progress = (Completed Tasks count / Total Tasks count).
     - If no tasks, progress is 0%.
  4. Project Progress = Sum(Pillar Weight * Pillar Progress).
*/

CREATE OR REPLACE FUNCTION get_project_progress(p_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_progress numeric := 0;
  pillar_rec record;
  task_count integer;
  done_count integer;
  pillar_progress numeric;
BEGIN
  -- Loop through each pillar for the project
  FOR pillar_rec IN 
    SELECT id, weight 
    FROM project_pillars 
    WHERE project_id = p_id
  LOOP
    
    -- Count total tasks for this pillar
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'Done')
    INTO task_count, done_count
    FROM project_tasks
    WHERE pillar_id = pillar_rec.id;
    
    -- Calculate pillar progress (avoid division by zero)
    IF task_count > 0 THEN
      pillar_progress := (done_count::numeric / task_count::numeric);
    ELSE
      pillar_progress := 0;
    END IF;
    
    -- Add weighted progress to total
    -- Weight is 0-100, so we multiply by (weight/100) or just sum (weight * progress) / 100 at the end if we want %
    -- Let's do: weight * progress (0-1) -> gives contribution 0-weight.
    total_progress := total_progress + (pillar_rec.weight * pillar_progress);
    
  END LOOP;
  
  -- Return rounded integer (0-100)
  RETURN ROUND(total_progress);
END;
$$;
