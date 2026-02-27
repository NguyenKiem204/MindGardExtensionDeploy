package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.FocusRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FocusRoomRepository extends JpaRepository<FocusRoom, Long> {
    List<FocusRoom> findByRoomStatus(String roomStatus);
}
