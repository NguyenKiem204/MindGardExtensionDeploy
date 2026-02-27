package com.kiemnv.MindGardAPI.repository;

import com.kiemnv.MindGardAPI.entity.FriendRequest;
import com.kiemnv.MindGardAPI.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    @Query("""
            SELECT fr FROM FriendRequest fr
            WHERE (fr.requester.id = :a AND fr.recipient.id = :b)
               OR (fr.requester.id = :b AND fr.recipient.id = :a)
            ORDER BY fr.createdAt DESC
            """)
    List<FriendRequest> findAnyBetween(@Param("a") Long a, @Param("b") Long b);

    @Query("""
            SELECT fr FROM FriendRequest fr
            WHERE fr.requester.id = :requesterId AND fr.recipient.id = :recipientId
            ORDER BY fr.createdAt DESC
            """)
    List<FriendRequest> findByRequesterAndRecipient(@Param("requesterId") Long requesterId,
                                                    @Param("recipientId") Long recipientId);

    List<FriendRequest> findByRecipientIdAndStatusOrderByCreatedAtDesc(Long recipientId, FriendRequest.Status status);
    List<FriendRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(Long requesterId, FriendRequest.Status status);

    @Query("""
            SELECT COUNT(fr) FROM FriendRequest fr
            WHERE fr.status = 'ACCEPTED' AND (fr.requester.id = :userId OR fr.recipient.id = :userId)
            """)
    long countFriends(@Param("userId") Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(fr) > 0 THEN true ELSE false END
            FROM FriendRequest fr
            WHERE fr.status = 'ACCEPTED'
              AND ((fr.requester.id = :a AND fr.recipient.id = :b) OR (fr.requester.id = :b AND fr.recipient.id = :a))
            """)
    boolean areFriends(@Param("a") Long a, @Param("b") Long b);

    @Query("""
            SELECT fr FROM FriendRequest fr
            WHERE fr.status = 'ACCEPTED'
              AND (fr.requester.id = :userId OR fr.recipient.id = :userId)
            ORDER BY fr.respondedAt DESC, fr.createdAt DESC
            """)
    List<FriendRequest> findAcceptedForUser(@Param("userId") Long userId);
}

