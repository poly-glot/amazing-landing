package repo

import (
	"context"
	"errors"
	"fmt"

	"cloud.google.com/go/datastore"
)

// Entity is the constraint for any model stored in Datastore.
type Entity interface {
	GetID() int64
	SetID(int64)
}

// Store provides generic Datastore CRUD for any Entity type.
type Store[T Entity] struct {
	Client *datastore.Client
	Kind   string
}

func (s *Store[T]) Save(ctx context.Context, e T) (T, error) {
	var key *datastore.Key
	if e.GetID() != 0 {
		key = datastore.IDKey(s.Kind, e.GetID(), nil)
	} else {
		key = datastore.IncompleteKey(s.Kind, nil)
	}
	k, err := s.Client.Put(ctx, key, e)
	if err != nil {
		return e, fmt.Errorf("saving %s: %w", s.Kind, err)
	}
	e.SetID(k.ID)
	return e, nil
}

func (s *Store[T]) FindByID(ctx context.Context, id int64, dest T) (T, error) {
	key := datastore.IDKey(s.Kind, id, nil)
	if err := s.Client.Get(ctx, key, dest); err != nil {
		if errors.Is(err, datastore.ErrNoSuchEntity) {
			var zero T
			return zero, nil
		}
		return dest, fmt.Errorf("finding %s by ID: %w", s.Kind, err)
	}
	dest.SetID(key.ID)
	return dest, nil
}

func (s *Store[T]) FindOne(ctx context.Context, q *datastore.Query) (T, error) {
	q = q.Limit(1)
	var results []T
	keys, err := s.Client.GetAll(ctx, q, &results)
	if err != nil {
		var zero T
		return zero, fmt.Errorf("querying %s: %w", s.Kind, err)
	}
	if len(results) == 0 {
		var zero T
		return zero, nil
	}
	results[0].SetID(keys[0].ID)
	return results[0], nil
}

func (s *Store[T]) FindAll(ctx context.Context, q *datastore.Query) ([]T, error) {
	var results []T
	keys, err := s.Client.GetAll(ctx, q, &results)
	if err != nil {
		return nil, fmt.Errorf("querying %s: %w", s.Kind, err)
	}
	for i, k := range keys {
		results[i].SetID(k.ID)
	}
	return results, nil
}

func (s *Store[T]) Query() *datastore.Query {
	return datastore.NewQuery(s.Kind)
}

func (s *Store[T]) Delete(ctx context.Context, id int64) error {
	key := datastore.IDKey(s.Kind, id, nil)
	if err := s.Client.Delete(ctx, key); err != nil {
		return fmt.Errorf("deleting %s: %w", s.Kind, err)
	}
	return nil
}

func (s *Store[T]) Count(ctx context.Context, q *datastore.Query) (int, error) {
	n, err := s.Client.Count(ctx, q)
	if err != nil {
		return 0, fmt.Errorf("counting %s: %w", s.Kind, err)
	}
	return n, nil
}
