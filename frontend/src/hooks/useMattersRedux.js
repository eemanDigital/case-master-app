// hooks/useMattersRedux.js
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getMatters,
  getMatter,
  createMatter,
  updateMatter,
  deleteMatter,
  getMatterStats,
  setFilters,
  clearFilters,
  setPagination,
  reset,
  resetMatter,
} from "../redux/slices/matterSlice";

export const useMattersRedux = () => {
  const dispatch = useDispatch();
  const matterState = useSelector((state) => state.matter);

  const fetchMatters = useCallback(
    (params = {}) => {
      return dispatch(getMatters({ ...matterState.filters, ...params }));
    },
    [dispatch, matterState.filters],
  );

  const fetchMatter = useCallback(
    (id) => {
      return dispatch(getMatter(id));
    },
    [dispatch],
  );

  const addMatter = useCallback(
    (matterData) => {
      return dispatch(createMatter(matterData));
    },
    [dispatch],
  );

  const modifyMatter = useCallback(
    (id, updates) => {
      return dispatch(updateMatter({ matterId: id, matterData: updates }));
    },
    [dispatch],
  );

  const removeMatter = useCallback(
    (id) => {
      return dispatch(deleteMatter(id));
    },
    [dispatch],
  );

  const fetchStats = useCallback(() => {
    return dispatch(getMatterStats());
  }, [dispatch]);

  const updateFilter = useCallback(
    (newFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch],
  );

  const resetFilter = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const updatePage = useCallback(
    (page) => {
      dispatch(setPagination({ page }));
    },
    [dispatch],
  );

  const resetState = useCallback(() => {
    dispatch(reset());
  }, [dispatch]);

  const resetCurrentMatter = useCallback(() => {
    dispatch(resetMatter());
  }, [dispatch]);

  return {
    ...matterState,
    fetchMatters,
    fetchMatter,
    addMatter,
    modifyMatter,
    removeMatter,
    fetchStats,
    updateFilter,
    resetFilter,
    updatePage,
    resetState,
    resetCurrentMatter,
  };
};
