/*** APP ***/
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useMutation,
} from "@apollo/client";

import { link } from "./link.js";
import { Layout } from "./layout.jsx";
import "./index.css";

/** @type {import('@apollo/client').TypePolicies} */
const typePolicies = {
  Address: {
    fields: {
      name: {
        read: (name) => name ? `${name}`.toUpperCase() : name,
      },
    }
  },
  All__: {
    fields: {
      // if fields has 'name', 'read' will be overriden by 'Address.fields.name.read'
      name: {
        // for test
        read: (name) => name,
      },
    },
  },
};
/** @type {import('@apollo/client').PossibleTypesMap} */
const possibleTypes = {
  // refs. https://github.com/apollographql/apollo-client/issues/11808
  All__: ['.*'],
};

const ALL_PEOPLE = gql`
  query AllPeople {
    people {
      id
      name
      address {
        id
        name
        location
      }
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: String) {
    addPerson(name: $name) {
      id
      name
    }
  }
`;

function App() {
  const [name, setName] = useState("");
  const { loading, data } = useQuery(ALL_PEOPLE);

  const [addPerson] = useMutation(ADD_PERSON, {
    update: (cache, { data: { addPerson: addPersonData } }) => {
      const peopleResult = cache.readQuery({ query: ALL_PEOPLE });

      cache.writeQuery({
        query: ALL_PEOPLE,
        data: {
          ...peopleResult,
          people: [...peopleResult.people, addPersonData],
        },
      });
    },
  });

  return (
    <main>
      <h3>Home</h3>
      <div className="add-person">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(evt) => setName(evt.target.value)}
        />
        <button
          onClick={() => {
            addPerson({ variables: { name } });
            setName("");
          }}
        >
          Add person
        </button>
      </div>
      <h2>Names</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <p>'person.name' should be as-is name, but is actually capitalized name which is applied by typePolicies.Address.fields.name.read.</p>
          <ul>
            {data?.people.map((person) => (
              <li key={person.id}>{person.name} (address name = {person.address?.name})</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies,
    possibleTypes,
  }),
  link,
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ApolloProvider client={client}>
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
        </Route>
      </Routes>
    </Router>
  </ApolloProvider>
);
