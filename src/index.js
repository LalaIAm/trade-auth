import express from 'express';
import bcrypt from 'bcrypt';
import { gql } from 'graphql-request';
import { client } from './client.js';
import { generateJWT } from './jwt.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  const { insert_user_one } = await client.request(
    gql`
      mutation registerUser($user: user_insert_input!) {
        insert_user_one(object: $user) {
          id
        }
      }
    `,
    {
      user: {
        email,
        password: await bcrypt.hash(password, 10),
      },
    }
  );

  const { id: userId } = insert_user_one;

  res.send({
    token: generateJWT({
      defaultRole: 'user',
      allowedRoles: ['user'],
      otherClaims: {
        'X-Hasura-User-Id': userId,
      },
    }),
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ;

  let { user } = await client.request(
    gql`
      query getUserByEmail($email: String!) {
        user(where: { email: { _eq: $email } }) {
          id
          password
        }
      }
    `,
    {
      email,
    }
  );

  // Since we filtered on a non-primary key we got an array back
  user = user[0];

  if (!user) {
    res.sendStatus(401);
    return;
  }

  // Check if password matches the hashed version
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (passwordMatch) {
    res.send({
      token: generateJWT({
        defaultRole: "user",
        allowedRoles: ["user"],
        otherClaims: {
          "X-Hasura-User-Id": user.id,
        },
      }),
    });
  } else {
    res.sendStatus(401);
  }
});

app.listen(port, () => {
  console.log(`Auth server running at ${port}`);
});
